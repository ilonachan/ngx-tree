import { ChangeDetectionStrategy, Component, HostBinding, Input, TemplateRef } from '@angular/core'
import { TreeNode, TreeUIOptions } from '../../models'

@Component({
    selector: 'ngx-tree-node-content',
    templateUrl: './tree-node-content.component.html',
    styleUrls: ['./tree-node-content.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeNodeContentComponent<D> {
    @Input() options: TreeUIOptions<D>
    @Input() node: TreeNode<D>
    @Input() index: number
    @Input() template: TemplateRef<any>
    @HostBinding('class.tree-node-content') className = true
}
