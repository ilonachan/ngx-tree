import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostBinding,
    Input,
    OnDestroy,
    OnInit,
} from '@angular/core';
import isFunction from 'lodash-es/isFunction';
import { merge, Subscription } from 'rxjs';

import {
    TreeNode,
    TreeTemplateMapping,
    TreeUIOptions,
    TreeUIOptionsInternal,
} from '../../models';

@Component({
    selector: 'ngx-tree-node',
    templateUrl: './tree-node.component.html',
    styleUrls: ['./tree-node.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeNodeComponent<D = any> implements OnInit, OnDestroy {
    @Input() node: TreeNode<D>;
    @Input() options: TreeUIOptionsInternal<D>;
    @Input() index: number;
    @Input() templates: TreeTemplateMapping;

    @HostBinding('class.tree-node') className = true;
    private operationSub = Subscription.EMPTY;

    constructor(private cdRef: ChangeDetectorRef) {}

    get allowDrop() {
        return (node: TreeNode<D>, $event?: DragEvent) => {
            return (
                // a node should never be dropped under itself
                !this.node.isDescendantOf(node) &&
                (isFunction(this.options.allowDrop)
                    ? this.options.allowDrop(
                          node,
                          { parent: this.node, dropOnNode: true },
                          $event
                      )
                    : this.options.allowDrop)
            );
        };
    }

    ngOnInit() {
        if (this.node.treeModel) {
            this.operationSub = merge(
                this.node.treeModel.events.expand,
                this.node.treeModel.events.collapse,
                this.node.treeModel.events.activate,
                this.node.treeModel.events.deactivate,
                this.node.treeModel.events.focus,
                this.node.treeModel.events.blur,
                this.node.treeModel.events.updateNode,
            ).subscribe((evt) => {
                if (evt.node && evt.node === this.node) {
                    this.cdRef.markForCheck();
                }
            });
            this.node.treeModel.events.updateNode.subscribe((e) => {
                if(e.node === this.node) {
                    console.log(e);
                    console.log(e.node.visibleChildren);
                    this.cdRef.markForCheck();
                }
            })
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if('node' in changes) {
            // console.log(changes.node.currentValue);
        }
    }

    ngOnDestroy() {
        this.operationSub.unsubscribe();
    }

    allowDrag(node: TreeNode<D>) {
        return isFunction(this.options.allowDrag) ? this.options.allowDrag(node) : this.options.allowDrag;
    }
}

import { animate, style, transition, trigger } from '@angular/animations';
import {
    // ChangeDetectionStrategy,
    // ChangeDetectorRef,
    // Component,
    // HostBinding,
    // Input,
    OnChanges,
    // OnDestroy,
    // OnInit,
    SimpleChanges,
} from '@angular/core';
// import { Subscription } from 'rxjs'
// import { TreeNode, TreeTemplateMapping, TreeUIOptions } from '../../models'
import {
    PosPair,
    TreeVirtualScroll,
} from '../../services/tree-virtual-scroll.service';
import { binarySearch } from '../../util';

/** Time and timing curve for expansion panel animations. */
export const EXPANSION_PANEL_ANIMATION_TIMING =
    '225ms cubic-bezier(0.4,0.0,0.2,1)';

@Component({
    selector: 'ngx-tree-node-children',
    templateUrl: './tree-node-children.component.html',
    styleUrls: ['./tree-node-children.component.scss'],
    animations: [
        trigger('expandAnimation', [
            transition(':enter', [
                style({ height: 0, overflow: 'hidden' }),
                animate(
                    EXPANSION_PANEL_ANIMATION_TIMING,
                    style({ height: '*' })
                ),
            ]),
            transition(':leave', [
                style({ height: '*', overflow: 'hidden' }),
                animate(EXPANSION_PANEL_ANIMATION_TIMING, style({ height: 0 })),
            ]),
        ]),
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeNodeChildrenComponent<D = any>
    implements OnInit, OnChanges, OnDestroy
{
    marginTop = 0;
    viewportNodes: TreeNode<D>[] = [];

    @Input() options: TreeUIOptionsInternal<D>;
    @Input() node: TreeNode<D>;
    @Input() templates: TreeTemplateMapping;
    @Input() disableMarginTop = false;
    @Input() children: TreeNode<D>[];
    @Input() refreshTree = false;

    @HostBinding('@expandAnimation')
    expandAnimation = true;

    @HostBinding('class.tree-node-children') className = true;

    @HostBinding('class.tree-children-no-padding')
    get noPadding() {
        return !this.options.levelPadding;
    }

    @HostBinding('style.margin-top.px')
    get marginTopAttr() {
        return this.disableMarginTop ? 0 : this.marginTop;
    }

    private scrollSub = Subscription.EMPTY;

    constructor(
        private virtualScroll: TreeVirtualScroll,
        private cdRef: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.viewportNodes = this.children;
        this.scrollSub = this.virtualScroll.waitForCollection(
            (metrics: PosPair) => {
                if (this.node.treeModel && this.node.isExpanded) {
                    // here we directly access node's visibleChildren but not component's `children`
                    // property is, because it will only be updated on next lifecycle check, which is
                    // after the collection notification
                    this.viewportNodes = this.getViewportNodes(
                        this.node.visibleChildren,
                        metrics
                    );
                    this.marginTop = this.calcMarginTop();
                    this.cdRef.markForCheck();
                }
            }
        );
    }

    ngOnChanges(changes: SimpleChanges) {
        if ('children' in changes && changes.children.currentValue) {
            this.viewportNodes =
                this.virtualScroll.isDisabled() || this.refreshTree
                    ? this.children
                    : this.viewportNodes;
        }
    }

    ngOnDestroy() {
        this.scrollSub.unsubscribe();
    }

    trackNode(index: number, node: TreeNode<D>) {
        return node.id;
    }

    calcMarginTop() {
        const firstNode =
            this.viewportNodes &&
            this.viewportNodes.length &&
            this.viewportNodes[0];

        // condition on root node is because the virtual root's self height is 0
        return firstNode
            ? Math.max(
                  0,
                  firstNode.position -
                      firstNode.parent!.position -
                      (firstNode.parent!.isRoot
                          ? 0
                          : this.virtualScroll.averageNodeHeight)
              )
            : 0;
    }

    getViewportNodes(nodes: TreeNode<D>[], { startPos, endPos }: PosPair) {
        if (!nodes || !nodes.length) {
            return [];
        }

        // Search for first node in the viewport using binary search
        // Look for first node that starts after the beginning of the viewport (with buffer)
        // Or that ends after the beginning of the viewport
        const firstIndex = binarySearch(nodes, (node) => {
            return (
                startPos <= node.position ||
                startPos <= node.position + node.height
            );
        });

        // Search for last node in the viewport using binary search
        // Look for first node that starts after the end of the viewport (with buffer)
        const lastIndex = binarySearch(
            nodes,
            (node) => {
                return (
                    endPos < node.position ||
                    endPos <= node.position + node.height
                );
            },
            firstIndex
        );

        const viewportNodes = nodes.slice(firstIndex, lastIndex + 1);

        // console.log(this.node.id, 'first: ', firstIndex, 'last: ', lastIndex, viewportNodes)

        return viewportNodes;
    }
}
