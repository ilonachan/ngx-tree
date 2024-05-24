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

    private resizeObserver: ResizeObserver;

    constructor(private virtualScroll: TreeVirtualScroll, private elementRef: ElementRef) {
        this.resizeObserver = new ResizeObserver((entries) => {
            for(const entry of entries) {
                this.onHeightUpdate(entry.contentRect.height);
            }
        })
    }

    ngOnInit() {
        this.node.elementRef = this.elementRef
    }

    ngOnDestroy() {
        this.node.elementRef = null
    }

    ngAfterViewInit() {
        if (this.virtualScroll.enabled) {
            // this.resizeObserver.observe(this.elementRef.nativeElement);
            this.onHeightUpdate(this.elementRef.nativeElement.getBoundingClientRect().height)
        }
    }

    onHeightUpdate(height) {
        this.virtualScroll.reportNodeHeight(height);
        if(this.node.ownHeight !== height) {
            this.node.ownHeight = height;
            // this.node.treeModel.fireEvent({eventName: 'updateNode', node: this.node});
        }
    }
}
