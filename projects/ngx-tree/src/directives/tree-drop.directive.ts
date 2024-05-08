import {
    Directive,
    ElementRef,
    EventEmitter,
    HostListener,
    Inject,
    Input,
    OnDestroy,
    Output,
    Renderer2,
} from '@angular/core';
import isFunction from 'lodash-es/isFunction';
import { DragAndDropEvent, TreeNode } from '../models';
import { TreeDraggingTargetService } from '../services/tree-dragging-target.service';

const DRAG_OVER_CLASS = 'is-dragging-over';
const DRAG_DISABLED_CLASS = 'is-dragging-over-disabled';

export type AllowDropPredicate = (
    element: TreeNode | null | undefined,
    $event: MouseEvent
) => boolean;

@Directive({
    selector: '[ngxTreeDrop]',
})
export class TreeDropDirective implements OnDestroy {
    @Input('ngxTreeDropTarget') target: TreeNode | null;
    @Input('ngxTreeDropIndex') index?: number;

    @Output('ngxTreeDrop') onDrop$ = new EventEmitter<DragAndDropEvent>();
    @Output('treeDropDragOver') onDragOver$ =
        new EventEmitter<DragAndDropEvent>();
    @Output('treeDropDragLeave') onDragLeave$ =
        new EventEmitter<DragAndDropEvent>();
    @Output('treeDropDragEnter') onDragEnter$ =
        new EventEmitter<DragAndDropEvent>();

    @Input()
    set treeAllowDrop(allowDrop: boolean | AllowDropPredicate) {
        this._allowDrop = isFunction(allowDrop)
            ? allowDrop
            : (element, $event) => allowDrop;
    }

    get treeAllowDrop() {
        return this._allowDrop;
    }

    private dragOverClassAdded: boolean;
    private disabledClassAdded: boolean;

    constructor(
        @Inject(ElementRef) private el: ElementRef,
        @Inject(Renderer2) private renderer: Renderer2,
        private treeDraggedElement: TreeDraggingTargetService
    ) {}

    ngOnDestroy() {
        this.onDrop$.complete();
        this.onDragEnter$.complete();
        this.onDragLeave$.complete();
        this.onDragOver$.complete();
    }

    makeEvent($event: DragEvent): DragAndDropEvent {
        return {
            event: $event,
            element: this.treeDraggedElement.get(),
            from: this.treeDraggedElement.get(),
            to: { parent: this.target, index: this.index },
        };
    }

    @HostListener('dragover', ['$event'])
    onDragOver($event: DragEvent) {
        if (!this.allowDrop($event)) {
            return;
        }

        this.onDragOver$.emit(this.makeEvent($event));

        if (!this.dragOverClassAdded) {
            this.addClass();
        }

        this._stopEvent($event);
    }

    @HostListener('dragenter', ['$event'])
    onDragEnter($event: DragEvent) {
        if (!this.allowDrop($event)) {
            this.addDisabledClass();

            return;
        }
        this.addClass();

        this.onDragEnter$.emit(this.makeEvent($event));

        this._stopEvent($event);
    }

    @HostListener('dragleave', ['$event'])
    onDragLeave($event: DragEvent) {
        if (!this.allowDrop($event)) {
            this.removeDisabledClass();

            return;
        }
        this.removeClass();

        this.onDragLeave$.emit(this.makeEvent($event));

        this._stopEvent($event);
    }

    @HostListener('drop', ['$event'])
    onDrop($event: DragEvent) {
        if (!this.allowDrop($event)) {
            return;
        }
        this.removeClass();

        this.onDrop$.emit(this.makeEvent($event));

        this.treeDraggedElement.set(null);

        this._stopEvent($event);
    }

    allowDrop($event: MouseEvent) {
        return this._allowDrop(this.treeDraggedElement.get(), $event);
    }

    private _stopEvent(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
    }

    private _allowDrop: AllowDropPredicate = (element, $event) => true;

    private addClass() {
        this.dragOverClassAdded = true;
        this.renderer.addClass(this.el.nativeElement, DRAG_OVER_CLASS);
    }

    private removeClass() {
        this.dragOverClassAdded = false;
        this.renderer.removeClass(this.el.nativeElement, DRAG_OVER_CLASS);
    }

    private addDisabledClass() {
        this.disabledClassAdded = true;
        this.renderer.addClass(this.el.nativeElement, DRAG_DISABLED_CLASS);
    }

    private removeDisabledClass() {
        this.disabledClassAdded = false;
        this.renderer.removeClass(this.el.nativeElement, DRAG_DISABLED_CLASS);
    }
}
