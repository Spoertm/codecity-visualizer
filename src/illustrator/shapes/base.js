var Measure = require("../geometry/measure.js");
var Point   = require("../geometry/point.js");
/**
 * All shapes occupy a square area.
 * It's dimensions described by the vector `dimensions`.
 * It can be placed on and rotated around the shapes centroid.
 * 
 * @interface
 */
class BaseShape {
    constructor(key) {
        this._key = String(key);
        this._dimensions = new Measure(0, 0);
        this._relativePosition = new Point(0, 0);
        this._rotation = 0;
    };

    get key() {
        return this._key;
    };

    /**
     * Get this shapes position, relative to it's parents centroid
     * @return {Point}
     */
    get relativePosition() {
        return this._relativePosition;
    }

    /**
     * Get the Shape's qubic size
     * @return {Measure}
     */
    get dimensions() {
        return this._dimensions;
    };

    /**
     * Get the shape's qubic size (after possible rotations)
     * @return {Measure}
     */
    get displayDimensions() {
        var swap = this.rotation % 180;
        return new Measure(
            swap ? this._dimensions.width  : this._dimensions.length,
            swap ? this._dimensions.length : this._dimensions.width
        );
    };

    /**
     * Get the shapes centroid
     * @return {Point}
     */
    get centroid () {
        return new Point(
            this.displayDimensions.length / 2,
            this.displayDimensions.width / 2
        );
    };

    /**
     * Get the 
     * @return {[type]} [description]
     */
    get rotation() {
        return this._rotation;
    };

    /**
     * Rotation the shape around the it's centroid.
     * @param  {int} degrees clockwise rotation
     *
     * http://www.hinterseher.de/Diplomarbeit/Transformation.html
     */
    rotate(degrees){
        if (degrees % 90) {
            throw 'Only 90° rotations allowed'
        }

        this._rotation = (360 + degrees) % 360;
    };

    /**
     * Draw the Shape
     * @TODO: Type?!?
     * @param  {Point} parentPosition [description]
     * @param  {int}   parentRotation [description]
     * @return {[type]}                [description]
     */
    draw(parentPosition, parentRotation) { throw 'NotImplementedException'; };
}

module.exports = BaseShape;
