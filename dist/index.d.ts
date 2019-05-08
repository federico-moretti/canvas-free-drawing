declare type Color = number[];
interface BaseObject {
    [key: string]: any;
}
interface Position {
    y: number;
    x: number;
    isBucket: boolean;
    newColor?: Color;
    tolerance?: number;
    strokeColor?: Color;
    moving?: boolean;
    lineWidth: number;
}
interface CanvasFreeDrawingParameters {
    elementId: string;
    width: number;
    height: number;
    backgroundColor?: Color;
    lineWidth?: number;
    strokeColor?: Color;
    disabled?: string;
    showWarnings?: boolean;
    maxSnapshots?: number;
}
interface NodeColorCache {
    [key: string]: boolean;
}
export declare enum AllowedEvents {
    redraw = "redraw",
    fill = "fill",
    mouseup = "mouseup",
    mousedown = "mousedown",
    mouseenter = "mouseenter",
    mouseleave = "mouseleave"
}
export default class CanvasFreeDrawing {
    elementId: string | void;
    canvasNode: HTMLElement | null;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    width: number;
    height: number;
    maxSnapshots: number;
    snapshots: ImageData[];
    undos: ImageData[];
    positions: [Position[]?];
    leftCanvasDrawing: boolean;
    isDrawing: boolean;
    isDrawingModeEnabled: boolean;
    imageRestored: boolean;
    lineWidth: number;
    backgroundColor?: Color;
    strokeColor: Color;
    bucketToolColor: Color;
    bucketToolTolerance: number;
    isBucketToolEnabled: boolean;
    listenersList: string[];
    redrawCounter: number;
    dispatchEventsOnceEvery: number;
    allowedEvents: string[];
    events: {
        [key: string]: Event;
    };
    bindings: {
        mouseDown: (event: MouseEvent) => void;
        mouseMove: (event: MouseEvent) => void;
        mouseLeave: (event: MouseEvent) => void;
        mouseUp: (event: MouseEvent) => void;
        mouseUpDocument: (event: MouseEvent) => void;
        touchStart: (event: TouchEvent) => void;
        touchMove: (event: TouchEvent) => void;
        touchEnd: (event: MouseEvent) => void;
        [name: string]: unknown;
    };
    touchIdentifier?: number;
    previousX?: number;
    previousY?: number;
    showWarnings: boolean;
    isNodeColorEqualCache: NodeColorCache;
    constructor(params: CanvasFreeDrawingParameters);
    requiredParam(object: BaseObject, param: string): void;
    logWarning(...args: string[]): void;
    addListeners(): void;
    removeListeners(): void;
    getAllowedEvents(): string[];
    enableDrawingMode(): boolean;
    disableDrawingMode(): boolean;
    mouseDown(event: MouseEvent): void;
    mouseMove(event: MouseEvent): void;
    touchStart(event: TouchEvent): void;
    touchMove(event: TouchEvent): void;
    touchEnd(): void;
    mouseUp(): void;
    mouseUpDocument(): void;
    mouseLeave(): void;
    mouseEnter(): void;
    handleEndDrawing(): void;
    drawPoint(x: number, y: number): void;
    drawLine(x: number, y: number, event: MouseEvent | TouchEvent): void;
    handleDrawing(dispatchEventsOnceEvery?: number): void;
    draw(position: Position[]): void;
    fill(x: number, y: number, newColor: Color, { tolerance }: {
        tolerance: number;
    }): void;
    toValidColor(color: Color): Color;
    isNodeColorEqual(i: Color, j: Color, t: number): boolean;
    getNodeColor(x: number, y: number, data: Uint8ClampedArray): Color;
    setNodeColor(x: number, y: number, color: Color, data: Uint8ClampedArray): void;
    rgbaFromArray(a: Color): string;
    setDimensions(): void;
    toggleCursor(): void;
    storeDrawing(x: number, y: number, moving: boolean): void;
    storeSnapshot(): void;
    getCanvasSnapshot(): ImageData;
    restoreCanvasSnapshot(imageData: ImageData): void;
    on(params: {
        event: AllowedEvents;
        counter?: number;
    }, callback: () => void): void;
    setLineWidth(px: number): void;
    setBackground(color: Color, save?: boolean): void;
    setDrawingColor(color: Color): void;
    setStrokeColor(color: Color): void;
    configBucketTool(params: {
        color?: Color;
        tolerance?: number;
    }): void;
    toggleBucketTool(): boolean;
    toggleDrawingMode(): boolean;
    clear(): void;
    save(): string;
    restore(backup: string, callback: () => void): void;
    undo(): void;
    redo(): void;
}
export {};
