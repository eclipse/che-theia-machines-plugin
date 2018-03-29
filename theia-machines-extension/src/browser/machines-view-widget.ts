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

import { injectable, inject } from 'inversify';
import {
    TreeWidget,
    TreeNode,
    NodeProps,
    SelectableTreeNode,
    TreeProps,
    ContextMenuRenderer,
    TreeModel,
    ExpandableTreeNode
} from '@theia/core/lib/browser';
import { Emitter } from '@theia/core';
import { CompositeTreeNode } from '@theia/core/lib/browser';
import { Message } from '@phosphor/messaging';

export interface MachinesSymbolInformationNode extends CompositeTreeNode, SelectableTreeNode, ExpandableTreeNode {
    iconClass: string;
}
export namespace MachinesSymbolInformationNode {
    export function is(node: TreeNode): node is MachinesSymbolInformationNode {
        return !!node && SelectableTreeNode.is(node) && 'iconClass' in node;
    }
}
export type MachinesViewWidgetFactory = () => MachinesViewWidget;
export const MachinesViewWidgetFactory = Symbol('MachinesViewWidgetFactory');


@injectable()
export class MachinesViewWidget extends TreeWidget {

    readonly onDidChangeOpenStateEmitter = new Emitter<boolean>();

    constructor(
        @inject(TreeModel) model: TreeModel,
        @inject(TreeProps) protected readonly treeProps: TreeProps,
        @inject(ContextMenuRenderer) protected readonly contextMenuRenderer: ContextMenuRenderer
    ) {
        super(treeProps, model, contextMenuRenderer);

        this.id = 'machines-view';
        this.title.label = 'Machines';
    }

    public setMachinesTree(roots: MachinesSymbolInformationNode[]) {
        this.model.root = <CompositeTreeNode>{
            id: 'machines-view-root',
            name: 'Machines Root',
            visible: false,
            children: roots,
            parent: undefined
        };
    }

    protected onAfterHide(msg: Message) {
        super.onAfterHide(msg);
        this.onDidChangeOpenStateEmitter.fire(false);
    }

    protected onAfterShow(msg: Message) {
        super.onAfterShow(msg);
        this.onDidChangeOpenStateEmitter.fire(true);
    }

    protected createNodeClassNames(node: TreeNode, props: NodeProps): string[] {
        const classNames = super.createNodeClassNames(node, props);
        if (MachinesSymbolInformationNode.is(node)) {
             classNames.push(node.iconClass);
        }
        return classNames;
    }

    protected isExpandable(node: TreeNode): node is ExpandableTreeNode {
        return ExpandableTreeNode.is(node) && node.children && node.children.length > 0;
    }
}
