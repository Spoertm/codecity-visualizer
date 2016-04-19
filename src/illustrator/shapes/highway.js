var BaseShape = require("./base.js");

/**
 * Draw a Highway
 * 
 * @implements BaseShape
 */
class Highway extends BaseShape {
    construct() {
        super();
        this._margin_x = 0;
        this._margin_y = 0;
        this._width    = 18;
        this._length   = 45;
        this._rotation = 0;
    }

    get dimensions() {
        return {
            x: this._width  + (2 * this._margin_x),
            y: this._length + (2 * this._margin_y)
        }
    };    

    set size(val) {
        this._length = val;
    }

    set absoluteX(x) {
        this.absolute.x = x;
    };

    set absoluteY(y) {
        this.absolute.y = y;
    };

    set rotation(degrees){
        this._rotation = degrees % 360;
    };

    draw() {
        throw 'not yet implemented'
    };
}

module.exports = Highway;
