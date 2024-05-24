import defaults from 'lodash-es/defaults';
import defaultsDeep from 'lodash-es/defaultsDeep';
import isNumber from 'lodash-es/isNumber';
import { defaultActionMapping } from './actions';
import { DragAndDropEvent } from './events';
import { TreeModel } from './tree-model';
import { TreeNode } from './tree-node';
import { isFunction, isString } from 'lodash-es';

/**
 * common functions to handle tree actions
 */
export interface ActionHandler<D, T = any, Args extends any[] = []> {
    // eslint-disable-next-line @typescript-eslint/prefer-function-type
    (tree: TreeModel<D>, node: TreeNode<D>, $event: T, ...args: Args): void;
}

/**
 * a mapping model to link mouse events and keyboard events with actions
 */
export interface ActionMapping<D> {
    mouse?: {
        click?: ActionHandler<D, MouseEvent>;
        dblClick?: ActionHandler<D, MouseEvent>;
        contextMenu?: ActionHandler<D, MouseEvent>;
        expanderClick?: ActionHandler<D, MouseEvent>;
        dragStart?: ActionHandler<D, DragEvent, [DragAndDropEvent<D>]>;
        drag?: ActionHandler<D, DragEvent, [DragAndDropEvent<D>]>;
        dragEnd?: ActionHandler<D, DragEvent, [DragAndDropEvent<D>]>;
        dragOver?: ActionHandler<D, DragEvent, [DragAndDropEvent<D>]>;
        dragLeave?: ActionHandler<D, DragEvent, [DragAndDropEvent<D>]>;
        dragEnter?: ActionHandler<D, DragEvent, [DragAndDropEvent<D>]>;
        drop?: ActionHandler<D, DragEvent, [DragAndDropEvent<D>]>;
    };
    keys?: {
        [key: number]: ActionHandler<D, KeyboardEvent>;
    };
}

export type AvailableMouseEvents = keyof Exclude<
    ActionMapping<any>['mouse'],
    undefined
>;

/**
 *
 */
export interface DropTarget<D> {
    parent: TreeNode<D>;
    index?: number;
    dropOnNode: boolean;
}

export type IAllowDropFn<D> = (
    element: TreeNode<D>,
    to: DropTarget<D>,
    $event?: DragEvent
) => boolean;

export type IAllowDragFn<D> = (node: TreeNode<D>) => boolean;

export type ILevelPaddingFn<D> = (node: TreeNode<D>) => string;
export type INodeClassFn<D> = (node: TreeNode<D>) => string | string[];
export type INodeStyleFn<D> = (node: TreeNode<D>) => {[key: string]: any};

export const defaultUIOptions: TreeUIOptions<unknown> = {
    allowDrag: false,
    allowDrop: false,
    levelPadding: 0,
    useVirtualScroll: false,
    nodeClass: '',
    nodeStyle: {},
};

export const defaultDataOptions: TreeDataOptions<unknown> = {
    accessors: {
        id: 'id',
        children: 'children',
        hasChildren: 'hasChildren',
        display: 'name',
        isExpanded: 'isExpanded',
        treeNode: [() => null as any, () => {}],
    },
    actionMapping: defaultActionMapping,
    fetchChildren: (node: TreeNode<unknown>) => {},
};

export interface TreeUIOptions<D = any> {
    /**
     * Specify if dragging tree nodes is allowed.
     * This could be a boolean, or a function that receives a TreeNode and returns a boolean
     *
     * **Default value: false**
     *
     * Example:
     * ```
     * options = {
     *   allowDrag: true
     * }
     * ```
     */
    allowDrag?: boolean | IAllowDragFn<D>;
    /**
     * Specify whether dropping inside the tree is allowed. Optional types:
     *  - boolean
     *  - (element:any, to:{parent:ITreeNode, index:number}):boolean
     * A function that receives the dragged element, and the drop location (parent node and index inside the parent),
     * and returns true or false.
     *
     * **Default Value: true**
     *
     * example:
     * ```
     * options = {
     *  allowDrop: (element, {parent, index}) => parent.isLeaf
     * }
     * ```
     */
    allowDrop?: boolean | IAllowDropFn<D>;
    /**
     * Specify padding per node instead of children padding (to allow full row select for example)
     */
    levelPadding?: number | ILevelPaddingFn<D>;
    /**
     * Boolean whether virtual scroll should be used.
     * Increases performance for large trees
     * Default is false
     */
    useVirtualScroll?: boolean;
    /**
     * How many pixels of overhang should be integrated into the virtual scroll viewport.
     * The larger the number the less likely that fast scrolls will cause white flashes,
     * but the more elements will be rendered.
     */
    virtualScrollOverhang?: [number, number];
    /**
     * the item height in tree the virtual scrolling algorithm will refer to, not determinate
     * if user provide a proper value, it would boost the initial rendering time for tree with big dataset initially
     */
    referenceItemHeight?: number;

    /**
     * Settings for virtual scroll.
     */
    virtualScroll?: {
        enabled?: boolean;
        refItemHeight?: number;
        overhangTop?: number;
        overhangBottom?: number;
    } | void;
    /**
     * an optional field to prevent repeating viewport update,
     * which is caused by some massive tree structure changes, such as `collapseAll()`, `expandAll()`
     * setting this field with a number would be useful for large scale tree, like throttle tailing.
     *
     * however, it would also cause the tree to be irreponsive for a short while
     */
    auditViewportUpdate?: number;

    /**
     * Supply function for getting a custom class for the node component
     */
    nodeClass?: INodeClassFn<D> | ReturnType<INodeClassFn<D>>;
    /**
     * Supply function for getting custom styles for the node component
     */
    nodeStyle?: INodeStyleFn<D> | ReturnType<INodeStyleFn<D>>;
}

export interface TreeUIOptionsInternal<D> extends TreeUIOptions<D> {
    allowDrag: IAllowDragFn<D> | boolean;
    allowDrop: IAllowDropFn<D> | boolean;
    levelPadding: ILevelPaddingFn<D>;
    nodeClass: INodeClassFn<D>;
    nodeStyle: INodeStyleFn<D>;
    useVirtualScroll: boolean;
}

/**
 * create tree options about UI with defaults
 * @param rawOpts
 */
export function createTreeUIOptions<D>(
    rawOpts: TreeUIOptions<D> = {}
): TreeUIOptionsInternal<D> {
    const opts = defaults({}, rawOpts, defaultUIOptions) as TreeUIOptions<D>;

    return {
        ...opts,
        levelPadding: cbOrSnapshot<ILevelPaddingFn<D>, number>(
            opts.levelPadding!,
            (padding) => (node: TreeNode<D>) =>
                `${padding + padding * (node.level - 1)}px`
        ),
        allowDrag: opts.allowDrag!,
        allowDrop: opts.allowDrop!,
        nodeClass: cbOrSnapshot<INodeClassFn<D>>(opts.nodeClass!),
        nodeStyle: cbOrSnapshot<INodeStyleFn<D>>(opts.nodeStyle!),
        useVirtualScroll: opts.useVirtualScroll!,
    };
}

export type CustomFieldPrefix = keyof TreeDataOptions['accessors'];
export type CustomFieldNames = `${CustomFieldPrefix}Field`;

export type NodeDataAccessorPair<D, T> = [
    get: (data: D) => T,
    set: (data: D, value: T) => void
];
export type NodeDataAccessor<D, T> =
    // field name or getset tuple, must have setter
    | NodeDataAccessorWithSetter<D, T>
    // getset tuple, but setter omitted
    | [get: NodeDataAccessorPair<D, T>[0]]
    // just getter function
    | NodeDataAccessorPair<D, T>[0];
export type NodeDataAccessorWithSetter<D, T> =
    // Field name
    | string
    // getset tuple
    | NodeDataAccessorPair<D, T>;

function accessorPair<D, T>(
    a: NodeDataAccessor<D, T>,
    requireSetter?: false
): NodeDataAccessorPair<D, T>;
function accessorPair<D, T>(
    a: NodeDataAccessorWithSetter<D, T>,
    requireSetter: true
): NodeDataAccessorPair<D, T>;
function accessorPair<D, T>(
    a: NodeDataAccessor<D, T>,
    requireSetter: boolean = false
): NodeDataAccessorPair<D, T> {
    // We get a proper field name, we can just do trivial getset
    if (isString(a))
        return [
            (d: any) => d[a as string],
            (d: any, v) => (d[a as string] = v),
        ];

    if (requireSetter && (isFunction(a) || a.length < 2))
        throw new Error('Setter is required for this field');

    if (isFunction(a)) a = [a];
    if (a.length === 1) a = [a[0], () => {}];
    return a;
}

export interface TreeDataOptions<D = any> {
    /**
     * Override the field accessors used to retrieve specific tree-structure information from the user data object.
     *
     * These properties are either a string determining the name of the field to be read-write accessed, or a pair of
     * getter and setter function to retrieve the value in arbitrary ways.
     */
    accessors?: {
        /**
         * The node's unique ID, determined by user data. Defaults to the field `id`. If that field is not set, a random UUID will be generated.
         */
        id?: NodeDataAccessor<D, string>;
        /**
         * The node's children, given as data objects. Defaults to the field `children`. Note that user changes to this property
         * can't be automatically tracked, so the tree node's {@link TreeNode.updateChildren `updateChildren`} method needs to be called
         * for the view to update.
         */
        children?: NodeDataAccessor<D, D[]>;
        /**
         * Whether the tree node is expected to have children, in case the `children` property returns `undefined`. This is used
         * to determine which nodes may be lazy-loaded, and should therefore be expandable even while currently not having any children.
         * Defaults to the field `hasChildren`.
         */
        hasChildren?: NodeDataAccessor<D, boolean>;
        /**
         * A display name for the node, used in the default display template. Defaults to the field `display`.
         */
        display?: NodeDataAccessor<D, string>;
        /**
         * Whether the node should start out in its expanded state. Defaults to the field `isExpanded`.
         */
        // TODO: make this an informative property as well, i.e. set it to the node's current expansion state.
        isExpanded?: NodeDataAccessor<D, boolean>;
        /**
         * Backreference to the internal wrapper object around the user data object; this is useful, for example, to allow the data object to notify the
         * tree node of changes. The getter functionality is never used. Unlike the other properties, this defaults to having no effect at all.
         */
        treeNode?: NodeDataAccessorWithSetter<D, TreeNode<D>>;
    };
    /**
     * Override children field. Default: 'children'
     *
     * @deprecated use {@link accessors.children} instead
     */
    childrenField?: string;
    /**
     * Override display field. Default: 'name'
     *
     * @deprecated use {@link accessors.display} instead
     */
    displayField?: string;
    /**
     * Override id field. Default: 'id'
     *
     * @deprecated use {@link accessors.id} instead
     */
    idField?: string;
    /**
     * Override isExpanded field. Default: 'isExpanded'
     *
     * @deprecated use {@link accessors.isExpanded} instead
     */
    isExpandedField?: string;
    /**
     * Change the default mouse and key actions on the tree
     */
    actionMapping?: ActionMapping<D>;

    /**
     * Supply function for getting fields asynchronously. Should return a Promise
     *
     * @deprecated use {@link fetchChildren} instead
     */
    getChildren?(node: TreeNode<D>): Promise<D[]>;
    /**
     * Supply function called when a lazy-loaded node is expanded (i.e. `hasChildren == true` and `children == undefined`).
     * If the function returns a list of children (as data objects), the node's `children` accessor
     * will be set to this value and the tree updated.
     */
    fetchChildren?(node: TreeNode<D>): Promise<D[] | undefined | void> | undefined | void;
}
export interface TreeDataOptionsInternal<D> extends TreeDataOptions<D> {
    accessors: {
        id: NodeDataAccessorPair<D, string>;
        children: NodeDataAccessorPair<D, D[]>;
        hasChildren: NodeDataAccessorPair<D, boolean>;
        display: NodeDataAccessorPair<D, string>;
        isExpanded: NodeDataAccessorPair<D, boolean>;
        treeNode: NodeDataAccessorPair<D, TreeNode<D>>;
    };
    actionMapping: ActionMapping<D>;
    fetchChildren?(node: TreeNode<D>): Promise<D[] | void> | void;
}

/**
 * create tree options about data with defaults
 * @param rawOpts
 */
export function createTreeDataOptions<D>(
    rawOpts: TreeDataOptions<D> = {}
): TreeDataOptionsInternal<D> {
    const opts = defaultsDeep(
        {},
        rawOpts,
        defaultDataOptions
    ) as TreeDataOptions<D>;

    return {
        ...opts,
        accessors: {
            id: accessorPair(opts.idField ?? opts.accessors!.id!),
            children: accessorPair(
                opts.childrenField ?? opts.accessors!.children!
            ),
            hasChildren: accessorPair(opts.accessors!.hasChildren!),
            display: accessorPair(
                opts.displayField ?? opts.accessors!.display!
            ),
            isExpanded: accessorPair(
                opts.isExpandedField ?? opts.accessors!.isExpanded!
            ),
            treeNode: accessorPair(opts.accessors!.treeNode!),
        },
        actionMapping: opts.actionMapping!,
        fetchChildren: opts.getChildren ?? opts.fetchChildren! ,
    };
}

// export const TREE_DATA_OPTIONS = new InjectionToken('TREE_DATA_OPTIONS')

function cbOrSnapshot<F extends (...args: any[]) => unknown>(
    input: F | ReturnType<F>
): F;
function cbOrSnapshot<F extends Function, D>(
    input: F | D,
    or: (data: D) => F,
    check?: (input: F | D) => input is F
): F;
function cbOrSnapshot<F extends Function, D>(
    input: F | D,
    or: (data: D) => F = (d) => (() => d) as any,
    check: (input: F | D) => input is F = isFunction as any
): F {
    if (check(input)) {
        return input;
    }
    const data = input;
    return or(data);
}
