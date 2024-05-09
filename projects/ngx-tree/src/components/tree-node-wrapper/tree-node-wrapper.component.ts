import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostBinding, Input, OnDestroy, OnInit, } from '@angular/core'
import { TreeNode, TreeTemplateMapping, TreeUIOptions } from '../../models'
import { TreeVirtualScroll } from '../../services/tree-virtual-scroll.service'

@Component({
    selector: 'ngx-tree-node-wrapper',
    templateUrl: './tree-node-wrapper.component.html',
    styleUrls: ['./tree-node-wrapper.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeNodeWrapperComponent<D> implements OnInit, OnDestroy, AfterViewInit {
    @Input() node: TreeNode<D>
    @Input() options: TreeUIOptions<D>
    @Input() index: number
    @Input() templates: TreeTemplateMapping

    @HostBinding('class.tree-node-wrapper') className = true

    constructor(private virtualScroll: TreeVirtualScroll, private elementRef: ElementRef) {
    }

    ngOnInit() {
        this.node.elementRef = this.elementRef
    }

    ngOnDestroy() {
        this.node.elementRef = null
    }

    ngAfterViewInit() {
        if (!this.virtualScroll.isDisabled() && !this.virtualScroll.hasEnoughNodeHeight) {
            this.virtualScroll.reportNodeHeight(this.elementRef.nativeElement.getBoundingClientRect().height)
        }
    }
}
