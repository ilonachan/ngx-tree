import {
    ChangeDetectionStrategy,
    Component,
    ContentChild,
    EventEmitter,
    HostBinding,
    HostListener,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChanges,
    TemplateRef,
    ViewChild,
} from '@angular/core';
import each from 'lodash-es/each';
import {
    createTreeUIOptions,
    IAllowDragFn,
    IAllowDropFn,
    ILevelPaddingFn,
    TreeDataOptions,
    TreeEvent,
    TreeModel,
    TreeNode,
    EventsMap,
    TREE_EVENTS,
    TreeUIOptionsInternal,
    TreeNodeEvent,
    TreeToggleExpanderEvent,
    TreeMoveNodeEvent,
    TreeUIOptions,
} from '../../models';
import { TreeDraggingTargetService } from '../../services/tree-dragging-target.service';
// import { TreeNodeChildrenComponent } from '../tree-node-children/tree-node-children.component'
import { TreeNodeChildrenComponent } from '../tree-node/tree-node.component';
import { TreeViewportComponent } from '../tree-viewport/tree-viewport.component';

@Component({
    selector: 'ngx-tree',
    templateUrl: './tree.component.html',
    styleUrls: ['./tree.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeComponent<D> implements OnChanges, OnDestroy {
    emitterMap: EventsMap<D>;
    treeModel: TreeModel<D> = null as any;
    UIOptions: TreeUIOptionsInternal<D>;
    refreshTree = false;

    /**
     * source data
     */
    @Input() nodes: any[];
    /**
     * id of the node to be focused on
     */
    @Input() focusTarget: string;
    /**
     * id of the node to be activated
     */
    @Input() activateTarget: string;
    @Input() dataOptions: TreeDataOptions<D>;

    @Input() allowDrag: boolean | IAllowDragFn<D>;
    @Input() allowDrop: boolean | IAllowDropFn<D>;
    @Input() levelPadding: number | ILevelPaddingFn<D>;
    @Input() useVirtualScroll: boolean;
    @Input() referenceItemHeight: number;
    @Input() auditViewportUpdate?: number;
    @Input() nodeClass: TreeUIOptions['nodeClass'];
    @Input() nodeStyle: TreeUIOptions['nodeStyle'];
    @Input() enableAnimation = true;
    @Input() keepNodesExpanded = false;
    @Input() virtualScrollOverhang: [number, number];

    /**
     * TODO
     */
    @Input() virtualScroll?: TreeUIOptions['virtualScroll'];

    @Output() expand = new EventEmitter<TreeNodeEvent<D>>();
    @Output() collapse = new EventEmitter<TreeNodeEvent<D>>();
    @Output() toggleExpander = new EventEmitter<TreeToggleExpanderEvent<D>>();
    @Output() activate = new EventEmitter<TreeNodeEvent<D>>();
    @Output() deactivate = new EventEmitter<TreeNodeEvent<D>>();
    @Output() focus = new EventEmitter<TreeNodeEvent<D>>();
    @Output() blur = new EventEmitter<TreeNodeEvent<D>>();
    @Output() initialized = new EventEmitter<TreeEvent>();
    @Output() moveNode = new EventEmitter<TreeMoveNodeEvent<D>>();
    @Output() loadChildren = new EventEmitter<TreeNodeEvent<D>>();
    @Output() changeFilter = new EventEmitter<TreeEvent>();
    @Output() addNode = new EventEmitter<TreeNodeEvent<D>>();
    @Output() removeNode = new EventEmitter<TreeNodeEvent<D>>();
    @Output() updateNode = new EventEmitter<TreeNodeEvent<D>>();

    @HostBinding('class.ngx-tree') className = true;

    @ContentChild('loadingTemplate') loadingTemplate: TemplateRef<any>;
    @ContentChild('expanderTemplate') expanderTemplate: TemplateRef<any>;
    @ContentChild('treeNodeTemplate') treeNodeTemplate: TemplateRef<any>;
    @ContentChild('treeNodeWrapperTemplate')
    treeNodeWrapperTemplate: TemplateRef<any>;
    @ContentChild('treeNodeFullTemplate')
    treeNodeFullTemplate: TemplateRef<any>;

    @ViewChild('viewport', { static: true })
    viewportComponent: TreeViewportComponent<D>;
    @ViewChild('root', { static: true }) root: TreeNodeChildrenComponent<D>;

    constructor(public treeDraggingTargetService: TreeDraggingTargetService) {
        this.emitterMap = (<(keyof typeof TREE_EVENTS)[]>(
            Object.keys(TREE_EVENTS)
        )).reduce((map, name) => {
            if (!this.hasOwnProperty(name)) {
                throw new TypeError(`Unmatched events: [${name}]`);
            }

            this[name] = map[name] = new EventEmitter();

            return map;
        }, {} as EventsMap<D>);

        this.UIOptions = createTreeUIOptions();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.nodes && changes.nodes.currentValue) {
            const oldTreeModel = this.treeModel;
            this.treeModel = new TreeModel(
                changes.nodes.currentValue,
                this.emitterMap,
                this.dataOptions
            );
            if (oldTreeModel && this.keepNodesExpanded) {
                oldTreeModel.expandedNodes.forEach((node) => {
                    this.treeModel!.setExpandedNodeInPlace(node);
                });
            }
            if (!changes.nodes.isFirstChange()) {
                this.refreshTree = true;
            }
        } else if (
            changes.dataOptions &&
            changes.dataOptions.currentValue &&
            this.treeModel
        ) {
            this.treeModel.updateOptions(changes.dataOptions.currentValue);
        }

        if (
            changes.focusTarget &&
            changes.focusTarget.currentValue &&
            this.treeModel
        ) {
            this.treeModel.focusNode(this.focusTarget);
        }

        if (
            changes.activateTarget &&
            changes.activateTarget.currentValue &&
            this.treeModel
        ) {
            this.treeModel.activateNode(this.activateTarget);
        }

        if (
            changes.allowDrag ||
            changes.allowDrop ||
            changes.levelPadding ||
            changes.useVirtualScroll ||
            changes.nodeClass ||
            changes.referenceItemHeight ||
            changes.auditViewportUpdate
        ) {
            this.UIOptions = createTreeUIOptions({
                allowDrag: this.allowDrag,
                allowDrop: this.allowDrop,
                levelPadding: this.levelPadding,
                useVirtualScroll: this.useVirtualScroll,
                virtualScrollOverhang: this.virtualScrollOverhang,
                referenceItemHeight: this.referenceItemHeight,
                auditViewportUpdate: this.auditViewportUpdate,
                nodeClass: this.nodeClass,
                nodeStyle: this.nodeStyle,
            });
        }
    }

    ngOnDestroy() {
        each(this.emitterMap, function (emitter) {
            emitter.complete();
        });
    }

    @HostListener('body: keydown', ['$event'])
    onKeydown($event: KeyboardEvent) {
        if (!this.treeModel.isFocused) {
            return;
        }

        if (
            ['input', 'textarea'].includes(
                document.activeElement!.tagName.toLowerCase()
            )
        ) {
            return;
        }

        const focusedNode = this.treeModel.focusedNode!;

        this.treeModel.performKeyAction(focusedNode, $event);
    }

    @HostListener('body: mousedown', ['$event'])
    onMousedown($event: MouseEvent) {
        const insideClick = (<HTMLElement>$event.target)!.closest('ngx-tree');

        if (!insideClick) {
            this.treeModel.setFocus(false);
        }
    }

    sizeChanged() {
        this.viewportComponent.setViewport();
    }
}
