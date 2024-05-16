import { Component, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { TreeComponent, TreeDataOptions, TreeNode, TreeUIOptions } from '@beezeelinx/ngx-tree';

@Component({
    selector: 'demo-simple',
    templateUrl: './simple.component.html',
    styleUrls: ['./simple.component.scss'],
})
export class SimpleComponent {
    title = 'demo';

    nodes: any[];

    asyncChildren = [
        {
            name: 'child2.1',
            subTitle: 'new and improved',
        },
        {
            name: 'child2.2',
            subTitle: 'new and improved2',
        },
    ];

    customOptions: TreeDataOptions & TreeUIOptions = {
        accessors: {
            isExpanded: 'expanded',
            id: 'uuid',
        },
        // displayField: 'subTitle',
        // isExpandedField: 'expanded',
        // idField: 'uuid',
        getChildren: this.getChildren.bind(this),
        useVirtualScroll: false,
        referenceItemHeight: 22,
        auditViewportUpdate: 0,
        allowDrag: (from) => {
            // console.log('allowDrag?');
            return true;
        },
        // allowDrop: false,
        allowDrop: (from, to) => {
            // console.log('allowDrop?');

            // In this simple setup, dropping on an unloaded async node will delete the dropped node permanently.
            // Depending on actual application logic this won't be the case, but for this example we guard against it.
            if(to.parent.hasChildren && !to.parent.children) {
                return false;
            }

            return true;
        },

        nodeClass: (node) => 'test-node-class',
        nodeStyle: (node) => {
            return {
                'color': 'orange',
                '--color': ['red','green','blue'][node.level%3]
            }
        }
    };

    constructor() {
        this.generateData(4);
    }

    regenerateData() {
        this.generateData(Math.floor(Math.random() * 5));
    }

    generateData(seed: number) {
        this.nodes = [
            {
                expanded: true,
                name: `[${seed}]root expanded 1`,
                subTitle: 'the root',
                children: [
                    {
                        name: 'child1',
                        subTitle: 'a good child',
                        hasChildren: false,
                    },
                    {
                        name: 'child2',
                        subTitle: 'a bad child',
                        hasChildren: false,
                    },
                ],
            },
            {
                expanded: true,
                name: `[${seed}]root expanded 2`,
                subTitle: 'the root',
                children: [
                    {
                        name: 'child1',
                        subTitle: 'a good child',
                        hasChildren: false,
                    },
                    {
                        name: 'child2',
                        subTitle: 'a bad child',
                        hasChildren: false,
                    },
                ],
            },
            {
                uuid: "asyncroot",
                name: `[${seed}]async root`,
                hasChildren: true,
            },
            {
                expanded: true,
                name: `[${seed}]root2`,
                subTitle: 'the second root',
                children: [
                    {
                        name: 'child2.1',
                        subTitle: 'new and improved',
                        uuid: '11',
                        hasChildren: false,
                    },
                    {
                        expanded: true,
                        name: 'child2.2',
                        subTitle: 'new and improved2',
                        children: [
                            {
                                uuid: 1001,
                                name: 'subsub',
                                subTitle: 'subsub',
                                hasChildren: false,
                            },
                            {
                                expanded: true,
                                name: 'root 3',
                                subTitle: 'the second root',
                                children: [
                                    {
                                        name: 'child2.1',
                                        subTitle: 'new and improved',
                                        uuid: '111',
                                        hasChildren: false,
                                    },
                                    {
                                        expanded: true,
                                        name: 'child2.2',
                                        subTitle: 'new and improved2',
                                        children: [
                                            {
                                                uuid: 10011,
                                                name: 'subsub',
                                                subTitle: 'subsub',
                                                hasChildren: false,
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                expanded: true,
                                name: 'root 4',
                                subTitle: 'the second root',
                                children: [
                                    {
                                        name: 'child2.1',
                                        subTitle: 'new and improved',
                                        uuid: '112',
                                        hasChildren: false,
                                    },
                                    {
                                        expanded: true,
                                        name: 'child2.2',
                                        subTitle: 'new and improved2',
                                        children: [
                                            {
                                                uuid: 10012,
                                                name: 'subsub',
                                                subTitle: 'subsub',
                                                hasChildren: false,
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ];

        for (let i = 0; i < seed * 5; i++) {
            this.nodes.push({
                expanded: i === 0,
                name: `[${seed}]root Dynamic${i}`,
                subTitle: `[${seed}]root created dynamically ${i}`,
                children: new Array((i + 1) * seed * 500)
                    .fill(null)
                    .map((item, n) => ({
                        name: `[${seed}]child Dynamic${i}.${n}`,
                        subTitle: `[${seed}]child created dynamically ${i}`,
                        hasChildren: false,
                    })),
            });
        }
    }

    getChildren(node: TreeNode) {
        return new Promise((resolve, reject) => {
            setTimeout(
                () =>
                    resolve(
                        this.asyncChildren.map((c) => {
                            return Object.assign({}, c, {
                                hasChildren: node.level < 5,
                            });
                        })
                    ),
                1000
            );
        });
    }

    @ViewChild('tree') tree!: TreeComponent<any>;

    modifyTreeData() {
        const asyncNode = this.tree.treeModel.getNodeById('asyncroot')!;
        asyncNode.data.children = [
            {
                name: 'friend1',
                subTitle: 'might appear',
                hasChildren: false,
            },
            {
                name: 'friend2',
                subTitle: 'when you need them',
                hasChildren: false,
            },
        ];
        asyncNode.updateChildren();
    }

    childrenCount(node: TreeNode): string {
        if (!node) return '';
        if (node.hasChildren && !node.children) return '(...)';
        if (!node.children || node.children.length === 0) return '';
        return `(${node.children.length})`;
    }

    log($event) {
        console.log($event);
    }
}
