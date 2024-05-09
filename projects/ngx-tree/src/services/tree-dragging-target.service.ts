import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'
import { TreeNode } from '../models'

@Injectable()
export class TreeDraggingTargetService extends Subject<TreeNode<unknown>> {

    _draggedElement: TreeNode<unknown> | null = null

    set (draggedElement: TreeNode<unknown> | null) {
        this._draggedElement = draggedElement
    }

    get () {
        return this._draggedElement
    }

    constructor() {
        super();
    }

    isDragging() {
        return !!this.get()
    }
}
