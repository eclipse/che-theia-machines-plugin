/*********************************************************************
 * Copyright (c) 2018 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import { injectable, inject } from 'inversify';
import { WidgetFactory } from '@theia/core/lib/browser';
import { Event, Emitter, DisposableCollection } from '@theia/core';
import { MachinesViewWidget, MachinesViewWidgetFactory, MachinesSymbolInformationNode } from './machines-view-widget';
import { Widget } from '@phosphor/widgets';

@injectable()
export class MachinesViewService implements WidgetFactory {

    id = 'machines-view';

    protected widget?: MachinesViewWidget;
    protected readonly onDidChangeMachinesEmitter = new Emitter<MachinesSymbolInformationNode[]>();
    protected readonly onDidChangeOpenStateEmitter = new Emitter<boolean>();
    protected readonly onDidSelectEmitter = new Emitter<MachinesSymbolInformationNode>();
    protected readonly onDidOpenEmitter = new Emitter<MachinesSymbolInformationNode>();

    constructor( @inject(MachinesViewWidgetFactory) protected factory: MachinesViewWidgetFactory) { }

    get onDidSelect(): Event<MachinesSymbolInformationNode> {
        return this.onDidSelectEmitter.event;
    }

    get onDidOpen(): Event<MachinesSymbolInformationNode> {
        return this.onDidOpenEmitter.event;
    }

    get onDidChangeMachines(): Event<MachinesSymbolInformationNode[]> {
        return this.onDidChangeMachinesEmitter.event;
    }

    get onDidChangeOpenState(): Event<boolean> {
        return this.onDidChangeOpenStateEmitter.event;
    }

    get open(): boolean {
        return this.widget !== undefined && this.widget.isVisible;
    }

    publish(roots: MachinesSymbolInformationNode[]): void {
        if (this.widget) {
            this.widget.setMachinesTree(roots);
            this.onDidChangeMachinesEmitter.fire(roots);
        }
    }

    createWidget(): Promise<Widget> {
        this.widget = this.factory();
        const disposables = new DisposableCollection();
        disposables.push(this.widget.onDidChangeOpenStateEmitter.event(open => this.onDidChangeOpenStateEmitter.fire(open)));
        disposables.push(this.widget.model.onOpenNode(node => this.onDidOpenEmitter.fire(node as MachinesSymbolInformationNode)));
        this.widget.disposed.connect(() => {
            this.widget = undefined;
            disposables.dispose();
        });
        return Promise.resolve(this.widget);
    }
}
