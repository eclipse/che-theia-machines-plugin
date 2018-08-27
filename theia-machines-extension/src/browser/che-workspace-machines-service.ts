/*********************************************************************
 * Copyright (c) 2018 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import {injectable, inject} from 'inversify';
import {EnvVariablesServer, EnvVariable} from '@theia/core/lib/common/env-variables';
import {CheWorkspaceClientService} from './che-workspace-client-service';
import {IWorkspace} from '@eclipse-che/workspace-client';

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
    protected waitWorkspaceId: Promise<string>;

    constructor(@inject(CheWorkspaceClientService) private readonly cheWorkspaceClient: CheWorkspaceClientService,
                @inject(EnvVariablesServer) protected readonly baseEnvVariablesServer: EnvVariablesServer) {

        this.waitWorkspaceId = this.baseEnvVariablesServer.getValue('CHE_WORKSPACE_ID')
            .then((workspaceIdEnv: EnvVariable | undefined) => {
                if (workspaceIdEnv && workspaceIdEnv.value) {
                    return Promise.resolve(workspaceIdEnv.value);
                }
                return Promise.reject('Failed to get workspace id');
            });
    }

    async updateMachines(): Promise<void> {
        const workspaceId = await this.waitWorkspaceId;
        if (!workspaceId) {
            return Promise.reject('Failed to get workspace id');
        }

        const remoteApi = await this.cheWorkspaceClient.restClient();
        if (!remoteApi) {
            return Promise.reject('Failed to get Eclipse CHE api endPoint');
        }

        const workspace = await remoteApi.getById<IWorkspace>(workspaceId);
        if (!workspace) {
            return Promise.reject('Failed to get workspace configuration');
        }

        const workspaceMachines = workspace!.runtime
            && workspace!.runtime!.machines
            || workspace!.config.environments[workspace.config.defaultEnv].machines
            || {};

        this.runtimeMachines.length = 0;

        Object.keys(workspaceMachines).forEach((machineName: string) => {
            const machine: IWorkspaceMachine = workspaceMachines[machineName];
            machine.machineName = machineName;
            this.runtimeMachines.push(machine);
        });
    }

    get machines(): Array<IWorkspaceMachine> {
        return this.runtimeMachines;
    }
}
