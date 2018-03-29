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

import { ContainerModule } from 'inversify';
import { ConnectionHandler, JsonRpcConnectionHandler } from "@theia/core/lib/common/messaging";
import { IBaseEnvVariablesServer, baseEnvVariablesPath } from '../common/base-env-variables-protocol';
import {BaseEnvVariablesServer} from './base-env-variables-server';

export default new ContainerModule(bind => {
    bind(IBaseEnvVariablesServer).to(BaseEnvVariablesServer).inSingletonScope();

    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(baseEnvVariablesPath, () => {
            return ctx.container.get<IBaseEnvVariablesServer>(IBaseEnvVariablesServer);
        })
    ).inSingletonScope();
});
