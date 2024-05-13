import { EventEmitter } from '@angular/core';
import { TreeNode } from './tree-node';
import { DropTarget } from './tree-options';

export const TREE_EVENTS = {
    expand: 'expand',
    collapse: 'collapse',
    toggleExpander: 'toggleExpander',
    activate: 'activate',
    deactivate: 'deactivate',
    focus: 'focus',
    blur: 'blur',
    initialized: 'initialized',
    moveNode: 'moveNode',
    loadChildren: 'loadChildren',
    changeFilter: 'changeFilter',
    removeNode: 'removeNode',
    addNode: 'addNode',
    updateNode: 'updateNode',
} as const;

/**
 * A general event fired when anything happens in the tree.
 */
export interface TreeEvent {
    eventName: keyof typeof TREE_EVENTS;
    $event?: Event;
}

/**
 * An event fired when anything happens to a node.
 */
export interface TreeNodeEvent<D = any> extends TreeEvent {
    node: TreeNode<D>;
}
/**
 * An event fired when the expander of a node is toggled, reporting the new state of the expander.
 */
export interface TreeToggleExpanderEvent<D = any> extends TreeNodeEvent<D> {
    eventName: (typeof TREE_EVENTS)['toggleExpander'];
    isExpanded: boolean;
}
/**
 *
 */
export interface TreeMoveNodeEvent<D = any> extends TreeNodeEvent<D> {
    eventName: (typeof TREE_EVENTS)['moveNode'];
    to: { parent: TreeNode<D>; index: number };
}

/**
 * An event fired when a Drag&Drop action occurs
 */
export interface DragAndDropEvent<D = any> {
    /**
     * The original mouse event
     */
    event: MouseEvent;
    /**
     * @deprecated use {@link from} instead.
     */
    element: TreeNode<D> | null;
    /**
     * The node being dragged, or `null` if the drag source isn't a tree node (which seems to not be possible as of yet).
     */
    from: TreeNode<D> | null;
    /**
     * The target for the drop, or `null` if the drop target isn't a tree node (which seems to not be possible as of yet).
     */
    to: DropTarget<D> | null;
}

/**
 * all events that the tree will trigger
 */
export interface EventsMap<D> {
    expand: EventEmitter<TreeNodeEvent<D>>;
    collapse: EventEmitter<TreeNodeEvent<D>>;
    toggleExpander: EventEmitter<TreeToggleExpanderEvent<D>>;
    /**
     * normally triggered by clicking or tabbing the enter key
     */
    activate: EventEmitter<TreeNodeEvent<D>>;
    deactivate: EventEmitter<TreeNodeEvent<D>>;
    /**
     * focus is different from activate, because focus can be changed by arrow keys of keyboard
     */
    focus: EventEmitter<TreeNodeEvent<D>>;
    blur: EventEmitter<TreeNodeEvent<D>>;
    initialized: EventEmitter<TreeEvent>;
    moveNode: EventEmitter<TreeMoveNodeEvent<D>>;
    loadChildren: EventEmitter<TreeNodeEvent<D>>;
    changeFilter: EventEmitter<TreeEvent>;
    removeNode: EventEmitter<TreeNodeEvent<D>>;
    addNode: EventEmitter<TreeNodeEvent<D>>;
    updateNode: EventEmitter<TreeNodeEvent<D>>;
}

export type EventType<name extends keyof EventsMap<D>, D = any> =
    EventsMap<D>[name] extends EventEmitter<infer E> ? E : never;
