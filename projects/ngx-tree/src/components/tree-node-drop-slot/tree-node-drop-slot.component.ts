import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
    DragAndDropEvent,
    TreeNode,
    TreeUIOptionsInternal,
} from '../../models';
import { isFunction } from 'lodash-es';

@Component({
    selector: 'ngx-tree-node-drop-slot',
    templateUrl: './tree-node-drop-slot.component.html',
    styleUrls: ['./tree-node-drop-slot.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeNodeDropSlotComponent<D> {
    @Input() node: TreeNode<D>;
    @Input() options: TreeUIOptionsInternal<D>;
    @Input() dropIndex: number;

    /**
     * Simply checks if this slot neighbors the node being dragged. This is just a basic
     * check that will deactivate only those specific dropslots, because dropping there wouldn't
     * change anything and should be equivalent to ending the drop early.
     */
    private isNeighboringSlot(draggedNode: TreeNode<D>): boolean {
        return (
            draggedNode.parent === this.node &&
            (this.dropIndex === draggedNode.index ||
                this.dropIndex === draggedNode.index + 1)
        );
    }

    allowDrop = (element: TreeNode<D>, $event: DragEvent) =>
        // A node should never be dropped under itself
        !this.node.isDescendantOf(element) &&
        // Dropping a node in a slot right next to it should be equivalent to cancelling the drop
        !this.isNeighboringSlot(element) &&
        (isFunction(this.options.allowDrop)
            ? this.options.allowDrop(
                    element,
                    {
                        parent: this.node,
                        index: this.dropIndex,
                    },
                    $event
                )
            : this.options.allowDrop);

    onDrop($event: DragAndDropEvent<D>) {
        this.node.mouseAction('drop', $event.event, {
            from: $event.from,
            to: $event.to,
        });
    }
}
