import { Inject, Injectable, InjectionToken } from '@angular/core';
import {
    ReplaySubject,
    Subject,
} from 'rxjs';
import { filter, scan } from 'rxjs/operators';
import { TreeModel, TreeNode } from '../models';

const Y_OFFSET_NODE_SIZE = 5;
let id = 0;

export const VIRTUAL_SCROLL_NODE_HEIGHT_QUOTA = new InjectionToken(
    'VIRTUAL_SCROLL_NODE_HEIGHT_QUOTA'
);

export interface PosPair {
    startPos: number;
    endPos: number;
}

@Injectable()
export class TreeVirtualScroll {
    averageNodeHeight = 0;

    private currentViewport: ClientRect;
    private lastScrollTop = 0;
    public enabled = false;

    private _overhangTop = 0;
    private _overhangBottom = 0;

    private scrollWindowChanged$ = new ReplaySubject<PosPair>(1);

    constructor(
        @Inject(VIRTUAL_SCROLL_NODE_HEIGHT_QUOTA) private quota: number
    ) {
        this.collectAverageNodeHeight();
    }

    updateOverhang(top: number, bottom: number, noUpdate = false) {
        this._overhangTop = top;
        this._overhangBottom = bottom;
        if (!noUpdate)
            this.adjustViewport(this.currentViewport, this.lastScrollTop);
    }

    adjustViewport(viewport: ClientRect, scrollTop: number) {
        this.lastScrollTop = scrollTop;
        this.currentViewport = viewport;

        const startPos = Math.max(scrollTop - this._overhangTop, 0);
        const endPos = viewport.height + scrollTop + this._overhangBottom;

        this.scrollWindowChanged$.next({
            startPos,
            endPos,
        });
    }

    reCalcPositions(treeModel: TreeModel<unknown>) {
        // here we reset the root nodes' positions to properly recalculate the positions
        // after some actions like filter

        this.recalcNodePosTotalHeight(treeModel.virtualRoot, 0);
    }

    scrollIntoView(
        node: TreeNode<unknown>,
        force: boolean,
        scrollToMiddle = true
    ) {
        if (
            force || // force scroll to node
            node.ownBtmPos < this.lastScrollTop || // node is above viewport
            node.position > this.lastScrollTop + this.currentViewport.height // node is below viewport
        ) {
            return scrollToMiddle
                ? node.position + (node.ownHeight - this.currentViewport.height) / 2 // scroll to middle
                : node.position; // scroll to start
        }

        return null;
    }

    private recalcNodePosTotalHeight(
        node: TreeNode<unknown>,
        startPos: number = 0
    ) {
        // TODO
        const DROPZONE_HEIGHT = 4;

        node.position = startPos;
        // TODO: use the actual node height, since we have it anyway! (in fact, don't set this here!)
        // node.ownHeight = node.isRoot ? 0 : this.averageNodeHeight;

        // TODO: maybe it's unnecessary to calculate the children heights unless they're actually needed?
        if(node.isExpanded) {
            node.childrenHeight = DROPZONE_HEIGHT;
            for (let child of node.visibleChildren) {
                this.recalcNodePosTotalHeight(
                    child,
                    startPos + node.ownHeight + node.childrenHeight
                );
                node.childrenHeight += child.height + DROPZONE_HEIGHT;
            }

            // TODO: use actual loading node height
            if (node.loadingChildren) node.childrenHeight += this.averageNodeHeight;
        }

        node.position = startPos;
        node.height = node.isHidden ? 0 : node.ownHeight + (node.isExpanded ? node.childrenHeight : 0);
    }

    private nodeHeightAnalytics$ = new Subject<number>();
    /**
     * Once a node's BBox height is known, this function is called to incorporate it into the average calculation.
     * Note that after enough height values have been collected, this function will not have any effect.
     * TODO: that is a problem if node heights need to be fully recalculated, which may happen in general scenarios!
     */
    reportNodeHeight(data: number) {
        this.nodeHeightAnalytics$.next(data);
    }

    /**
     * Sets up a subscriber for the `nodeHeightAnalytics$`, to which new node heights are pushed.
     * Whenever that happens, the average height of all so far encountered nodes is recalculated...
     * unless the new average is significantly different from the old one, in which case the running
     * average is reset to the latest height value.
     *
     * If the count of collected node heights exceeds a certain value (`VIRTUAL_SCROLL_NODE_HEIGHT_QUOTA`),
     * no new node heights will be accepted, ever.
     */
    private collectAverageNodeHeight() {
        this.nodeHeightAnalytics$
            .pipe(
                scan<number, { sum: number; count: number }>(
                    (acc, cur) => {
                        const lastAvg = acc.sum / acc.count;
                        const sum = cur + acc.sum;
                        const count = acc.count + 1;
                        const avg = sum / count;
                        if (avg / lastAvg > 1.5 || lastAvg / avg > 1.5) {
                            return { sum: cur, count: 1 };
                        }

                        return { sum, count };
                    },
                    { sum: 0, count: 0 }
                )
            )
            .subscribe(({ sum, count }) => {
                this.averageNodeHeight = sum / count;
                if (count >= this.quota) {
                    this.nodeHeightAnalytics$.complete();
                }
            });
    }
}
