import { TreeNode } from './tree-node';
import { DropTarget } from './tree-options';

export interface TreeEvent {
    eventName: string;
    node?: TreeNode;
    isExpanded?: boolean;
    to?: { parent: TreeNode; index: number };
}

/**
 * An event fired when a Drag&Drop action occurs
 */
export interface DragAndDropEvent {
    /**
     * The original mouse event
     */
    event: MouseEvent;
    /**
     * @deprecated use {@link from} instead.
     */
    element: TreeNode | null;
    /**
     * The node being dragged, or `null` if the drag source isn't a tree node (which seems to not be possible as of yet).
     */
    from: TreeNode | null;
    /**
     * The target for the drop, or `null` if the drop target isn't a tree node (which seems to not be possible as of yet).
     */
    to: DropTarget | null;
}
