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
import {IWorkspace, IRequestError} from 'workspace-client';
import {CheWorkspaceClientService} from './che-workspace-client-service';
import {IBaseEnvVariablesServer} from '../common/base-env-variables-protocol';

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
    protected workspaceId: string | undefined;

    constructor(@inject(CheWorkspaceClientService) private readonly cheWorkspaceClient: CheWorkspaceClientService,
                @inject(IBaseEnvVariablesServer) protected readonly baseEnvVariablesServer: IBaseEnvVariablesServer) {

        this.baseEnvVariablesServer.getEnvValueByKey('CHE_WORKSPACE_ID').then((workspaceId: string) => {
            this.workspaceId = workspaceId;
        });
    }


    async updateMachines(): Promise<Array<IWorkspaceMachine>> {
        if (!this.workspaceId) {
            return Promise.reject('Failed to get workspaceId');
        }
        this.runtimeMachines.length = 0;

        return new Promise<Array<IWorkspaceMachine>>((resolve, reject) => {
            this.cheWorkspaceClient.restClient.getById<IWorkspace>(this.workspaceId)
                .catch((reason: IRequestError) => {
                    reject(`Failed to get workspace by ID:${this.workspaceId}, Status code: ${reason.status}`);
                })
                .then((workspace: IWorkspace) => {
                    if (workspace && workspace.runtime) {
                        Object.keys(workspace.runtime.machines).forEach((machineName: string) => {
                            const machine: IWorkspaceMachine = workspace.runtime.machines[machineName];
                            machine.machineName = machineName;
                            this.runtimeMachines.push(machine);
                        });
                    } else {
                        // in the case without workspace runtime
                        const workspaceMachines = workspace.config.environments[workspace.config.defaultEnv].machines;
                        Object.keys(workspaceMachines).forEach((machineName: string) => {
                            const machine: IWorkspaceMachine = workspaceMachines[machineName];
                            machine.machineName = machineName;
                            this.runtimeMachines.push(machine);
                        });
                    }
                    resolve(this.runtimeMachines);
                });
        });
    }

    get machines(): Array<IWorkspaceMachine> {
        return  this.runtimeMachines;
    }
}
