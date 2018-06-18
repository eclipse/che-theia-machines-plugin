/*
 * Copyright (c) 2018 Red Hat, Inc.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import {injectable, inject} from 'inversify';
import { EnvVariablesServer, EnvVariable } from "@theia/core/lib/common/env-variables";
import { CheWorkspaceClientService } from './che-workspace-client-service';
import {IWorkspace} from '@eclipse-che/workspace-client';
import { Deferred } from '@theia/core/lib/common/promise-util';

export interface IWorkspaceMachine {
    machineName?: string;
    servers?: {
        [serverRef: string]: {
            url?: string;
            port?: string;
        }
    };
    status: string;
}

@injectable()
export class CheWorkspaceMachinesService {

    protected runtimeMachines: Array<IWorkspaceMachine> = [];
    protected waitWorkspaceId = new Deferred<string>();

    constructor(
        @inject(CheWorkspaceClientService) private readonly cheWorkspaceClient: CheWorkspaceClientService,
        @inject(EnvVariablesServer) protected readonly baseEnvVariablesServer: EnvVariablesServer) {

        this.baseEnvVariablesServer.getValue('CHE_WORKSPACE_ID').then((workspaceIdEnv: EnvVariable | undefined) => {
            if (workspaceIdEnv && workspaceIdEnv.value) {
                this.waitWorkspaceId.resolve(workspaceIdEnv.value);
            } else {
                this.waitWorkspaceId.reject('Failed to get workspace id');
            }
        });
    }

    async updateMachines(): Promise<Array<IWorkspaceMachine>> {
        const workspaceId = await this.waitWorkspaceId.promise;
        if (!workspaceId) {
            return Promise.reject('Failed to get workspaceId');
        }

        const remoteApi = await this.cheWorkspaceClient.restClient();

        return new Promise<Array<IWorkspaceMachine>>((resolve, reject) => {
            remoteApi.getById<IWorkspace>(workspaceId)
                .then((workspace: IWorkspace) => {
                    const workspaceMachines = workspace && workspace.runtime && workspace.runtime.machines || workspace.config.environments[workspace.config.defaultEnv].machines || [];

                    this.runtimeMachines.splice(0, this.runtimeMachines.length);
                    for (const machineName in workspaceMachines) {
                        const machine: IWorkspaceMachine = workspaceMachines[machineName];
                        machine.machineName = machineName;
                        this.runtimeMachines.push(machine);
                    }

                    return resolve(this.runtimeMachines);
                }).catch(reason => {
                    reject(`Failed to update list machines.`);
                })
        });
    }

    get machines(): Array<IWorkspaceMachine> {
        return this.runtimeMachines;
    }
}
