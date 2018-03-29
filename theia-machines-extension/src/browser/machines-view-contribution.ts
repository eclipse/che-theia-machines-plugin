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
import {DisposableCollection} from '@theia/core';
import {AbstractViewContribution} from '@theia/core/lib/browser/shell/view-contribution';
import {CheWorkspaceMachinesService, IWorkspaceMachine} from './che-workspace-machines-service';
import {MachinesViewService} from './machines-view-service';
import {MachinesSymbolInformationNode, MachinesViewWidget} from './machines-view-widget';

interface NodeAndSymbol {
    node: MachinesSymbolInformationNode;
    symbol: SymbolInformation;
}

interface SymbolInformation {
    name: string;
    id: string;
    parentId: string | undefined;
    kind?: SymbolKind | undefined;
}

export const MACHINES_NAVIGATOR_ID = 'machines-view';

const enum SymbolKind {
    Empty = 1,
    Machine,
    Terminal
}
const EMPTY_CLASS = 'fa fa-times-circle';
const MACHINE_CLASS = 'fa fa-circle';
const TERMINAL_CLASS = 'fa fa-terminal';

@injectable()
export class MachinesViewContribution extends AbstractViewContribution<MachinesViewWidget> {

    protected ids: string[] = [];
    protected symbolList: NodeAndSymbol[] = [];
    protected readonly toDispose = new DisposableCollection();


    constructor(@inject(MachinesViewService) protected readonly machineViewService: MachinesViewService,
                @inject(CheWorkspaceMachinesService) private readonly cheMachines: CheWorkspaceMachinesService) {
        super({
            widgetId: MACHINES_NAVIGATOR_ID,
            widgetName: 'Machines',
            defaultWidgetOptions: {
                area: 'right',
                rank: 500
            },
            toggleCommandId: 'machines:toggle',
            toggleKeybinding: 'ctrlcmd+shift+n'
        });
    }

    protected onStart() {
        this.updateMachines();
        this.machineViewService.onDidChangeOpenState(async isOpen => {
            if (isOpen) {
                this.updateMachines();
            }
        });
        this.machineViewService.onDidSelect(async node => {
            // TODO: Add terminal's call if it terminal node.
        });
    }

    protected updateMachines() {
        this.cheMachines.updateMachines().then(() => {
            const machines: Array<IWorkspaceMachine> = this.cheMachines.machines;
            this.publish(machines);
        });
    }

    protected publish(machines: Array<IWorkspaceMachine>) {
        this.ids.length = 0;
        this.symbolList.length = 0;

        const entries: Array<SymbolInformation> = [];

        machines.forEach(machine => {
            const machineEntry = {
                name: machine.machineName,
                id: this.getRandId(machine.machineName),
                parentId: undefined,
                kind: machine.status ? SymbolKind.Machine : SymbolKind.Empty
            };
            entries.push(machineEntry);

            const status = machine.status;
            if (status) {
                entries.push({
                    name: status,
                    id: this.getRandId(machine.machineName, 'status'),
                    parentId: machineEntry.id
                });
            }

            const servers = machine.servers;
            if (servers) {
                const serversEntryName = 'servers';
                const serversEntry = {
                    name: serversEntryName,
                    id: this.getRandId(serversEntryName),
                    parentId: machineEntry.id
                };
                entries.push(serversEntry);
                Object.keys(servers).forEach((serverName: string) => {
                    const entryName = servers[serverName].url ? servers[serverName].url : servers[serverName].port;
                    if (!entryName) {
                        return;
                    }
                    const serverEntry = {
                        name: entryName.toString(),
                        id: this.getRandId(serverName),
                        parentId: serversEntry.id
                    };
                    entries.push(serverEntry);
                    entries.push({
                        name: `name: ${serverName}`,
                        id: this.getRandId(serverName, 'name'),
                        parentId: serverEntry.id
                    });
                });
            }
            /*
             // TODO: Add terminal's call if it terminal node.
             const terminalEntryName = 'terminal';
             entries.push({
             name: terminalEntryName,
             id: this.getRandId(terminalEntryName),
             parentId: machineEntry.id,
             kind: SymbolKind.Terminal
             });
             */
        });

        this.machineViewService.publish(this.createTree(undefined, entries));
    }

    protected createTree(parentNode: NodeAndSymbol | undefined, symbolInformationList: Array<SymbolInformation>): MachinesSymbolInformationNode[] {
        const childNodes: NodeAndSymbol[] =
            symbolInformationList
                .filter(s => (!parentNode && !s.parentId) || (parentNode && parentNode.symbol.id === s.parentId))
                .map(sym => this.convertToNode(sym, parentNode));
        childNodes.forEach(childNode => {
            const nodeSymbol = symbolInformationList.filter(s => childNode.symbol.id !== s.id);
            childNode.node.children = this.createTree(childNode, nodeSymbol);
        });
        return childNodes.map(n => n.node);
    }

    protected convertToNode(symbol: SymbolInformation, parent: NodeAndSymbol | undefined): NodeAndSymbol {
        const iconClass = this.getClass(symbol.kind);
        const node: MachinesSymbolInformationNode = {
            children: [],
            id: symbol.id,
            iconClass,
            name: symbol.name,
            parent: parent ? parent.node : undefined,
            selected: false,
            expanded: false
        };
        const symbolAndNode = {node, symbol};
        this.symbolList.push(symbolAndNode);
        return symbolAndNode;
    }

    private getRandId(nodeName: string, key?: string): string {
        let uniqueId: string;
        let name = key ? `${nodeName}_${key}` : nodeName;
        for (let counter = 0; counter < 100; counter++) {
            uniqueId = `${name}_id_${('0000' + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4)}`;
            if (this.ids.findIndex(id => id === uniqueId) === -1) {
                break;
            }
        }
        this.ids.push(uniqueId);
        return uniqueId;
    }

    private getClass(symbolKind: SymbolKind): string | undefined {
        switch (symbolKind) {
            case SymbolKind.Empty:
                return EMPTY_CLASS;
            case SymbolKind.Machine:
                return MACHINE_CLASS;
            case SymbolKind.Terminal:
                return TERMINAL_CLASS;
        }
        return undefined;
    }
}
