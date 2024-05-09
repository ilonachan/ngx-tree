import { Inject, Injectable, InjectionToken } from '@angular/core'
import { BehaviorSubject, Observer, PartialObserver, Subject, Subscription } from 'rxjs'
import { filter, scan } from 'rxjs/operators'
import { TreeModel, TreeNode } from '../models'

const Y_OFFSET_NODE_SIZE = 3
let id = 0

export const VIRTUAL_SCROLL_NODE_HEIGHT_QUOTA = new InjectionToken('VIRTUAL_SCROLL_NODE_HEIGHT_QUOTA')

export interface PosPair {
    startPos: number
    endPos: number
}

function pairIsValid(input: any): input is PosPair {
    return !!input
}

@Injectable()
export class TreeVirtualScroll {
    id: number
    averageNodeHeight = 0
    hasEnoughNodeHeight = false

    private currentViewport: ClientRect
    private lastScrollTop = 0
    private disabled = false

    private collectionMonitor$ = new BehaviorSubject<PosPair | null>(null)
    private nodeHeightAnalytics$ = new Subject<number>()

    constructor(@Inject(VIRTUAL_SCROLL_NODE_HEIGHT_QUOTA) private quota: number) {
        this.id = id++
        this.collectAverageNodeHeight()
    }

    adjustViewport(viewport: ClientRect, scrollTop: number) {
        this.lastScrollTop = scrollTop
        this.currentViewport = viewport

        const Y_OFFSET = this.averageNodeHeight * Y_OFFSET_NODE_SIZE

        const startPos = scrollTop > Y_OFFSET ? scrollTop - Y_OFFSET : 0
        const endPos = viewport.height + scrollTop + Y_OFFSET

        this.collectionMonitor$.next({
            startPos,
            endPos,
        })
    }

    waitForCollection(observer: any): Subscription {
        return this.collectionMonitor$
            .pipe(filter(pairIsValid))
            .subscribe(observer)
    }

    reportNodeHeight(data: number) {
        this.nodeHeightAnalytics$.next(data)
    }

    reCalcPositions(treeModel: TreeModel<unknown>) {
        // here we reset the root nodes' positions to properly recalculate the positions
        // after some actions like filter
        treeModel.roots.forEach(node => {
            node.position = 0
        })
        treeModel.virtualRoot.height = this.getPositionAfter(treeModel.getVisibleRoots(), 0)
    }

    setDisabled(isDisabled: boolean) {
        this.disabled = isDisabled
    }

    isDisabled() {
        return this.disabled
    }

    scrollIntoView(node: TreeNode<unknown>, force: boolean, scrollToMiddle = true) {
        if (force || // force scroll to node
            node.position < this.lastScrollTop || // node is above viewport
            node.position + this.averageNodeHeight > this.lastScrollTop + this.currentViewport.height) { // node is below viewport

            return scrollToMiddle ? node.position - this.currentViewport.height / 2 + this.averageNodeHeight : // scroll to middle
                node.position // scroll to start
        }

        return null
    }

    private getPositionAfter(nodes: TreeNode<unknown>[], startPos: number) {
        let position = startPos

        nodes.forEach((node) => {
            node.position = position
            // as node is hidden, it should play as a shadow node for it next sibling node for
            // the proper position splitting
            position = this.getPositionAfterNode(node, node.position, node.isHidden)
        })

        return position
    }

    private getPositionAfterNode(node: TreeNode<unknown>, startPos: number, isPrevShadow = false) {
        let position = isPrevShadow ? startPos : this.averageNodeHeight + startPos

        if (node.children && node.isExpanded) { // TBD: consider loading component as well
            position = this.getPositionAfter(node.visibleChildren, position)
        }

        // todo: here we assume the loading component's height is the same as averageNodeHeight
        node.height = position - startPos + (node.loadingChildren ? this.averageNodeHeight : 0)

        return position
    }

    private collectAverageNodeHeight() {
        this.nodeHeightAnalytics$
            .pipe(scan<number, number[]>((acc, cur) => {
                const lastAvg = acc[0] / acc[1]
                const sum = cur + acc[0]
                const count = acc[1] + 1
                const avg = sum / count
                if (avg / lastAvg > 1.5 || lastAvg / avg > 1.5) {
                    return [cur, 1]
                }

                return [sum, count]
            }, [0, 0]))
            .subscribe(pair => {
                this.averageNodeHeight = pair[0] / pair[1]
                if (pair[1] >= this.quota) {
                    this.hasEnoughNodeHeight = true
                }
            })
    }
}
