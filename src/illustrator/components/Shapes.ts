import { Cuboid } from "../../components/Cuboid";
import { Point } from "../../components/Point";

/**
 * All shapes occupy a square area.
 * It's dimensions are described by the vector `dimensions`.
 * It can be placed and rotated around the shape's centroid.
 */
export abstract class Shape {
    protected _key: string;
    protected _hasBeenDrawn: boolean;
    public _absolutePosition: PointInterface;
    protected _absoluteRotation: number;
    private _attributes: ShapeBaseAttributes;

    constructor(key: string) {
        this._key = key;

        this._hasBeenDrawn = false;
        this._absolutePosition = new Point();
        this._absoluteRotation = 0;

        this._attributes = {
            key,
            type: "shape",
            dimensions: new Cuboid(),
            margin: 0,
            position: new Point(),
            rotation: 0
        };
    }

    /**
     * The shape"s (and it"s associated model node"s) identifier
     */
    get key(): string {
        return this._key;
    }

    /**
     * Set the margin for this shape
     */
    set margin(margin: number) {
        this._attributes.margin = margin;
    }

    /**
     * Get the margin for this shape
     */
    get margin(): number {
        return this._attributes.margin;
    }

    /**
     * Get this shapes position, relative to it's parent's centroid
     * @return {Point}}
     * @protected
     */
    get position(): Point {
        return (this._attributes.position as Point);
    }

    /**
     * Get the shape's qubic footprint (before any rotation)
     * Intended only for private/protected use.
     * @return {Cuboid}
     * @protected
     */
    get dimensions(): CuboidInterface {
        return (this._attributes.dimensions as Cuboid);
    }

    /**
     * Get the shape's qubic footprint (after any possible relative rotations)
     */
    get displayDimensions(): CuboidInterface {
        const swap = this.rotation % 180;
        const l = this.dimensions.length + 2 * this.margin;
        const w = this.dimensions.width + 2 * this.margin;
        const h = this.dimensions.height + 2 * this.margin;
        return new Cuboid(
            swap ? w : l,
            swap ? l : w,
            h
        );
    }

    /**
     * Get the shapes centroid (with relative rotation)
     */
    get centroid(): PointInterface {
        return new Point(
            this.displayDimensions.length / 2,
            this.displayDimensions.width / 2
        );
    }

    /**
     * Get the shapes centroid (with relative rotation)
     */
    get centroid3D(): PointInterface {
        return new Point(
            this.displayDimensions.length / 2,
            this.displayDimensions.width / 2,
            this.displayDimensions.height / 2
        );
    }

    /**
     * Get the relative rotation in degrees
     */
    get rotation(): number {
        return this._attributes.rotation;
    }

    /**
     * Convert Shape to String (it"s key/name)
     */
    public toString(): string {
        return String(this._key);
    }

    /**
     * Rotate the shape around the it's centroid (clockwise rotation).
     */
    public rotate(degrees: number) {
        this._attributes.rotation = (720 + this.rotation + degrees) % 360;
    }

    /**
     * Draw the Shape (calculate final absolute position and rotation)
     */
    public draw(parentPosition: PointInterface, parentRotation: number) {
        const a = (720 - parentRotation) % 360;
        const rad = a * (Math.PI / 180);
        const transformedRelativePosition = new Point(
            Math.cos(rad) * this.position.x - Math.sin(rad) * this.position.y,
            Math.sin(rad) * this.position.x + Math.cos(rad) * this.position.y,
            this.position.z
        );

        if (this instanceof Street) {
            console.log('test');
        }

        this._absolutePosition = new Point(
            parentPosition.x + transformedRelativePosition.x,
            parentPosition.y + transformedRelativePosition.y,
            parentPosition.z + transformedRelativePosition.z
        );

        this._absoluteRotation = (360 + parentRotation + this.rotation) % 360;
        this._hasBeenDrawn = true;
    }

    /**
     * Draw the Shape
     */
    public getSpatialInformation(): ShapeBaseAttributes[] {
        if (!this._hasBeenDrawn) {
            throw new Error("Node has not been drawn yet");
        }

        const swap = this._absoluteRotation % 180;
        const rotatedDimensions = new Cuboid(
            swap ? this.dimensions.width : this.dimensions.length,
            swap ? this.dimensions.length : this.dimensions.width,
            this.dimensions.height
        );

        const spatialInformation = Object.assign({}, this._attributes);

        spatialInformation.dimensions = rotatedDimensions;
        spatialInformation.position = this._absolutePosition;
        spatialInformation.rotation = this._absoluteRotation;

        return [spatialInformation];
    }

    /**
     * Updates the internal AttributeContainer for the SpatialInformation.
     * Also applies Spatial Data for this Shape directly.
     */
    public updateAttributes(attributes: ShapeAttributes): void {
        for (const key in attributes) {
            if (attributes.hasOwnProperty(key)) {
                const value = attributes[key];
                this.updateAttribute(this._attributes, key.split("."), value);
            }
        }
    }

    /**
     * Returns the attribute recorded for key
     */
    public getAttribute(key: string): any {
        const keys: string[] = key.split(".");
        let attr: any = this._attributes;
        while (keys.length && attr) {
            const index = keys.shift() as string;
            attr = attr[index];
        }
        return attr;
    }

    /**
     * Updates a single value within the attributes object
     */
    private updateAttribute(obj: AttributeContainer, keys: string[], value: any): void {
        if (!keys.length) {
            return;
        }

        const k = keys.shift() as string;
        if (!keys.length) {
            obj[k] = value;
        } else {
            if (!(k in obj)) {
                obj[k] = {};
            }
            this.updateAttribute(obj[k], keys, value);
        }
    }
}

export class House extends Shape {
    constructor(key: string) {
        super(key);
        this.updateAttributes({ type: "house" });
    }
}

export class Platform extends Shape {
    constructor(key: string) {
        super(key);
        this.updateAttributes({ type: "platform" });
    }
}

export class Street extends Shape {
    constructor(key: string) {
        super(key);
        this.updateAttributes({ type: "street" });
    }
}

export class Highway extends Street {
}

export class Ferry extends Shape {
    constructor(key: string, startHouse: House, endHouse: House) {
        super(key);
        this.updateAttributes({ type: "ferry" });

        let smallerHouse = startHouse.displayDimensions.height < endHouse.displayDimensions.height
            ? startHouse : endHouse;

        let midPoint = this.midPoint(startHouse._absolutePosition, endHouse._absolutePosition);

        this.position.x = midPoint.x;
        this.position.y = midPoint.y;
        this.position.z = smallerHouse.centroid3D.z - smallerHouse.dimensions.height / 2;

        let newDimensions = this.getGapSizeBetween(startHouse, endHouse);

        this.dimensions.length = newDimensions.length;
        this.dimensions.width = newDimensions.width;
        this.dimensions.height = newDimensions.height;
    }

    private midPoint(point1: PointInterface, point2: PointInterface): PointInterface {
        let mid_x = (point1.x + point2.x) / 2
        let mid_y = (point1.y + point2.y) / 2

        return new Point(mid_x, mid_y);
    }

    private getGapSizeBetween(house1: House, house2: House) : CuboidInterface {
        const gap_x = Math.abs(house1._absolutePosition.x - house2._absolutePosition.x);
        const gap_y = Math.abs(house1._absolutePosition.y - house2._absolutePosition.y);

        let length_new, width_new;
        if (gap_x < gap_y) {
            length_new = gap_x;
            width_new = gap_y;
        } else {
            length_new = gap_y;
            width_new = gap_x;
        }

        let smallerHouse = house1.displayDimensions.height < house2.displayDimensions.height
            ? house1 : house2;

        return new Cuboid(length_new, width_new, smallerHouse.dimensions.height)
    }


    public finalize() {
    }
}
