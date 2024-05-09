import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'

import { TreeModel, TreeNode, TreeUIOptionsInternal } from '../../models/index'
import { TreeDraggingTargetService } from '../../services/tree-dragging-target.service'
import { TreeComponent } from './tree.component'

@Component({
    selector: 'ngx-tree-node-children',
    template: '',
})
export class FakeTreeNodeChildrenComponent {

    @Input() options: TreeUIOptionsInternal<any>
    @Input() node: TreeNode
    @Input() templates: any
    @Input() disableMarginTop = false
    @Input() children: TreeNode[]
    @Input() refreshTree = false

    constructor() {
    }
}

@Component({
    selector: 'ngx-tree-viewport',
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FakeTreeViewportComponent {
    @Input() enable: boolean

    @Input() treeModel: TreeModel
    @Input() referenceItemHeight = 0
    @Input() auditViewportUpdate?: number

    virtualScroll = {
        isDisabled() {return false}
    }

    constructor() {
    }
}

describe('TreeComponent', () => {
    let component: TreeComponent<any>
    let fixture: ComponentFixture<TreeComponent<any>>

    beforeEach(async(() => {
        TestBed.configureTestingModule({
                imports: [
                    NoopAnimationsModule,
                ],
                declarations: [
                    TreeComponent,
                    FakeTreeNodeChildrenComponent,
                    FakeTreeViewportComponent,
                ],
                providers: [
                    TreeDraggingTargetService,
                ]
            })
            .compileComponents()
    }))

    beforeEach(() => {
        fixture = TestBed.createComponent(TreeComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should be created', () => {
        expect(component).toBeTruthy()
    })
})
