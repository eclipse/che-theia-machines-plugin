/*********************************************************************
 * Copyright (c) 2018 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import {ContainerModule, interfaces} from 'inversify';
import {FrontendApplicationContribution, createTreeContainer, TreeWidget} from '@theia/core/lib/browser';
import {KeybindingContribution} from '@theia/core/lib/browser/keybinding';
import {WidgetFactory} from '@theia/core/lib/browser/widget-manager';
import {CommandContribution} from '@theia/core/lib/common/command';
import {MenuContribution} from '@theia/core/lib/common/menu';
import {MachinesViewService} from './machines-view-service';
import {MachinesViewContribution} from './machines-view-contribution';
import {CheWorkspaceClientService} from './che-workspace-client-service';
import {CheWorkspaceMachinesService} from './che-workspace-machines-service';
import {MachinesViewWidgetFactory, MachinesViewWidget} from './machines-view-widget';

export default new ContainerModule(bind => {
    // add your contribution bindings here
    bind(CheWorkspaceClientService).toSelf();
    bind(CheWorkspaceMachinesService).toSelf();

    bind(MachinesViewWidgetFactory).toFactory(ctx =>
        () => createMachinesViewWidget(ctx.container)
    );

    bind(MachinesViewService).toSelf().inSingletonScope();
    bind(WidgetFactory).toDynamicValue(context => context.container.get(MachinesViewService));

    bind(MachinesViewContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toDynamicValue(c => c.container.get(MachinesViewContribution));

    bind(CommandContribution).toDynamicValue(c => c.container.get(MachinesViewContribution));
    bind(KeybindingContribution).toDynamicValue(c => c.container.get(MachinesViewContribution));
    bind(MenuContribution).toDynamicValue(c => c.container.get(MachinesViewContribution));
});

function createMachinesViewWidget(parent: interfaces.Container): MachinesViewWidget {
    const child = createTreeContainer(parent);

    child.unbind(TreeWidget);
    child.bind(MachinesViewWidget).toSelf();

    return child.get(MachinesViewWidget);
}
