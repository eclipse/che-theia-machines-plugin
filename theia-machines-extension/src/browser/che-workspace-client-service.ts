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

import {inject, injectable} from 'inversify';
import {IBaseEnvVariablesServer} from '../common/base-env-variables-protocol';
import {getRestApi, getBackend, IRemoteAPI, IBackend} from 'workspace-client';

@injectable()
export class CheWorkspaceClientService {

    private cheApi: string;
    private _backend: IBackend;

    constructor(@inject(IBaseEnvVariablesServer) protected readonly baseEnvVariablesServer: IBaseEnvVariablesServer) {
        this.baseEnvVariablesServer.getEnvValueByKey('CHE_API').then((cheApi: string) => {
            this.cheApi = cheApi;
        });
        this._backend = getBackend();
    }

    get restClient(): IRemoteAPI {
        return getRestApi({
            baseUrl: this.cheApi
        });
    }

    get backend(): IBackend {
        return this._backend;
    }
}
