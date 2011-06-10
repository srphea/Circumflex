//------------------------------------------------------------------------------
// ==ClosureCompiler==
// @output_file_name circumflex.min.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// ==/ClosureCompiler==
//------------------------------------------------------------------------------

// Dear little namespace, with love :)
cf = {};

//------------------------------------------------------------------------------

/**
 * Load an image from either URL or from Data
 *
 * @param {number|string} i URL, or width of the image when loading from data
 * @param {number=}       m Height of the image when loading from data
 * @param {Array=}        g Array containing the image data
 * @return The DOM Element representing the image
 */
cf.Image = function(i, m, g) {
    if(typeof i == 'number' && i > 0 && m > 0 && g) {
        return cf.Image.FromData(i, m, g);
    }
    else if(typeof i == 'string') {
        return cf.Image.FromUrl(i);
    }
}

/**
 * Load an image from a URL, automatically called by cf.Image
 *
 * @param {string} src URL of the image
 * @return A <img> DOM Element representing the image
 */
cf.Image.FromUrl = function(src) {
    var d = document.createElement('img');
    d.src = src;
    return d;
}

/**
 * Load an image from a Data array
 *
 * @param {number} width  Width of the image
 * @param {number} height Height of the image
 * @param {Array}  data   Array containing the image data
 * @return A <canvas> DOM Element representing the image
 */
cf.Image.FromData = function(width, height, data) {
    var d       = document.createElement('canvas');
    if(!d.getContext) return;
    var ctx     = d.getContext('2d'),
        imgData = ctx.createImageData(d.width = width,
                                      d.height = height);
                                      
    // ImageData.data is read only, so we copy byte by byte
    for(var i = 0; i < width * height * 4; ++i) {
        imgData.data[i] = data[i];
    }
        
    ctx.putImageData(imgData, 0, 0);
    return d;
}

//------------------------------------------------------------------------------

/**
 * Utility class to manipulate time
 * @constructor
 */
cf.Clock = function() {
    this.Reset();
}

/**
 * Get time elapsed
 *
 * @return {number} Time elapsed in milliseconds
 */
cf.Clock.prototype.GetElapsedTime = function() {
    var now = new Date();
    return now.getTime() - this._startTime;
}

/**
 * Restart timer
 */
cf.Clock.prototype.Reset = function() {
    var now = new Date();
    this._startTime = now.getTime();
}

//------------------------------------------------------------------------------

/**
 * Utility class for handling rectangle coordinates
 * @constructor
 *
 * @param {number=} x      Left coordinate of the rectangle
 * @param {number=} y      Top coordinate of the rectangle
 * @param {number=} width  Width of the rectangle
 * @param {number=} height Height of the rectangle
 */
cf.Rect = function(x, y, width, height) {
    this.Left   = x || 0;
    this.Top    = y || 0;
    this.Width  = width || 0;
    this.Height = height || 0;
}

/**
 * Check if a point is inside the rectangle.
 * A point ON the rectangle is considered inside of it
 *
 * @param {Object|number} x A {x, y} Object or the X coordinate of the point
 * @param {number=}       y Y coordinate of the point
 */
cf.Rect.prototype.Contains = function(x, y) {
    if(typeof x == 'object') {
        y = x.y;
        x = x.x;
    }
    
    return (x >= this.Left &&
            y >= this.Top &&
            x <= this.Left + this.Width &&
            y <= this.Top + this.Height);
}

/**
 * Check the intersection between two rectangles
 *
 * @param {Object|number} x      A cf.Rect Object or Left coordinate of the Rect
 * @param {number=}       y      Top coordinate of the Rect
 * @param {number=}       width  Width of the Rect
 * @param {number=}       height Height of the Rect
 */
cf.Rect.prototype.Intersects = function(x, y, width, height) {
    // Convert the cf.Rect to mere arguments
    if(typeof x == 'object') {
        width  = x.Width;
        height = x.Height;
        y      = x.Top;
        x      = x.Left;
    }
    
    // Compute the intersection boundaries
    var left   = Math.max(this.Left,              x),
        top    = Math.max(this.Top,               y),
        right  = Math.min(this.Left + this.Width, x + width),
        bottom = Math.min(this.Top + this.Height, y + height);

    // If it's a positive non zero area, then there is an intersection
    if((left < right) && (top < bottom)) {
        return new cf.Rect(left, top, right - left, bottom - top);
    }
    else {
        return false;
    }
}

//------------------------------------------------------------------------------

/**
 * Utility class to manipulate 3D matrices
 * @constructor
 *
 * @param {number=} a00 A value of the matrix
 * @param {number=} a01 A value of the matrix
 * @param {number=} a02 A value of the matrix
 * @param {number=} a10 A value of the matrix
 * @param {number=} a11 A value of the matrix
 * @param {number=} a12 A value of the matrix
 * @param {number=} a20 A value of the matrix
 * @param {number=} a21 A value of the matrix
 * @param {number=} a22 A value of the matrix
 */
cf.Matrix3 = function(a00, a01, a02,
                      a10, a11, a12,
                      a20, a21, a22) {
                      
    this.data = [a00||1, a10||0, a20||0,
                 a01||0, a11||1, a21||0,
                 a02||0, a12||0, a22||1];
}


/**
 * Transform a point by the matrix
 *
 * @param {number|Object}  x A {x, y} Object or the X value of the point
 * @param {number=}        y The Y value of the point
 * @return {Object} Coordinates of the transformed point
 */
cf.Matrix3.prototype.Transform = function(x, y) {
    if(typeof x == 'object') {
        y = x.y;
        x = x.x;
    }
    
    return {x: this.data[0] * x + this.data[3] * y + this.data[6],
            y: this.data[1] * x + this.data[4] * y + this.data[7]};
}


/**
 * Computes the inverse of the matrix
 *
 * @return {Object} The inverse of this matrix
 */
cf.Matrix3.prototype.Inverse = function() {
    var m = this.data;
    
    // Calculate the deteminant
    var det = m[0] * (m[8] * m[4] - m[5] * m[7]) -
              m[1] * (m[8] * m[3] - m[5] * m[6]) +
              m[2] * (m[7] * m[3] - m[4] * m[6]);
    
    // Return an identity matrix if determinant is zero
    if(!det) {
        return new cf.Matrix3();
    }
    
    // Calculate the inverse
    return new cf.Matrix3((m[8] * m[4] - m[5] * m[7]) / det,
                         -(m[8] * m[3] - m[5] * m[6]) / det,
                          (m[7] * m[3] - m[4] * m[6]) / det,
                         -(m[8] * m[1] - m[2] * m[6]) / det,
                          (m[8] * m[0] - m[2] * m[6]) / det,
                         -(m[7] * m[0] - m[1] * m[6]) / det,
                          (m[5] * m[1] - m[2] * m[4]) / det,
                         -(m[5] * m[0] - m[2] * m[3]) / det,
                          (m[4] * m[0] - m[1] * m[3]) / det);
}

/**
 * Multiplies this matrix by another
 *
 * @param {Object} other The matrix to multiply by
 * @return {Object} The product of the two matrices
 */
cf.Matrix3.prototype.Multiply = function(other) {
    var m = this.data,
        v = other.data;
    
    // Multiply m with v
    return new cf.Matrix3(m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
                          m[0] * v[3] + m[3] * v[4] + m[6] * v[5],
                          m[0] * v[6] + m[3] * v[7] + m[6] * v[8],
                          m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
                          m[1] * v[3] + m[4] * v[4] + m[7] * v[5],
                          m[1] * v[6] + m[4] * v[7] + m[7] * v[8],
                          m[2] * v[0] + m[5] * v[1] + m[8] * v[2],
                          m[2] * v[3] + m[5] * v[4] + m[8] * v[5],
                          m[2] * v[6] + m[5] * v[7] + m[8] * v[8]);
}

/**
 * Replaces Canvas' current matrix with this one
 *
 * @param {Object} ctx Reference to the canvas's context
 */
cf.Matrix3.prototype.Set = function(ctx) {
    if(ctx) {
        var m = this.data;
        ctx.setTransform(m[0], m[1],
                         m[3], m[4],
                         m[6], m[7]);
    }
}

/**
 * Multiplies Canvas' current matrix with this one
 *
 * @param {Object} ctx Reference to the canvas's context
 */
cf.Matrix3.prototype.Apply = function(ctx) {
    if(ctx) {
        var m = this.data;
        ctx.transform(m[0], m[1],
                      m[3], m[4],
                      m[6], m[7]);
    }
}

/**
 * Build a matrix from a set of transformations
 *
 * @param {number}  ox   Origin's X coordinate
 * @param {number}  oy   Origin's Y coordinate
 * @param {number}  tx   Translation's X coordinate
 * @param {number}  ty   Translation's Y coordinate
 * @param {number}  rot  Rotation (in degrees)
 * @param {number}  sx   Scale's X factor
 * @param {number}  sy   Scale's Y factor
 * @param {number=} skx  Skew X degree
 * @param {number=} sky  Skew Y degree
 * @return {Object} A new matrix containing the transformations
 */
cf.Matrix3.Transformation = function(ox, oy, tx, ty, rot, sx, sy, skx, sky) {
    // Avoid tan(90)
    if(skx % 180 == 90) skx = 0;
    if(sky % 180 == 90) sky = 0;
    
    // Combine the transformations
    var angle  = rot * 3.141592654 / 180,
        skewX  = skx * 3.141592654 / 180,
        skewY  = sky * 3.141592654 / 180,
        cosine = Math.cos(angle),
        sine   = Math.sin(angle),
        tanX   = Math.tan(skewX),
        tanY   = Math.tan(skewY),
        sxCos  = sx * cosine,
        syCos  = sy * cosine,
        sxSin  = sx * sine + tanX,
        sySin  = sy * sine + tanY,
        shiftx = -ox * sxCos - oy * sySin + tx,
        shifty =  ox * sxSin - oy * syCos + ty;

    // Construct the matrix
    return new cf.Matrix3( sxCos, sySin, shiftx,
                          -sxSin, syCos, shifty,
                           0,     0,     1);
}

//------------------------------------------------------------------------------

/**
 * Handles the view on the canvas
 * @constructor
 *
 * @param {number}  pWidth   Width of the parent canvas
 * @param {number}  pHeight  Height of the parent canvas
 * @param {number=} x        X center of the view
 * @param {number=} y        Y center of the view
 * @param {number=} width    Width of the view
 * @param {number=} height   Height of the view
 * @param {number=} rotation the orientation of the view
 */
cf.View = function(pWidth, pHeight, x, y, width, height, rotation) {
    this._centerX          = x || pWidth / 2 || 256;
    this._centerY          = y || pHeight / 2 || 256;
    this._width            = pWidth || width || 512;
    this._height           = pHeight || height || 512;
    this._rotation         = (rotation||0) % 360;
    this._pWidth           = pWidth || 512;
    this._pHeight          = pHeight || 512;
    
    this._matrix           = null;
    this._invMatrix        = null;
    this._matrixUpdated    = false;
    this._invMatrixUpdated = false;
    
    this._transformedRect        = {};
    this._transformedRectUpdated = false;
}


/**
 * Set view's center
 *
 * @param {number}  x A {x, y} Object or X coordinate of the center of the view
 * @param {number=} y Y coordinate of the desired center of the view
 */
cf.View.prototype.SetCenter = function(x, y) {
    this._centerX                = x || 0; //Closure Compiler needs it :(
    this._centerY                = y || 0; //Closure Compiler needs it :(
    this._matrixUpdated          = false;
    this._invMatrixUpdated       = false;
    this._transformedRectUpdated = false;
}

/**
 * Get view's center
 *
 * @return {Object} Coordinates of the center of the view
 */
cf.View.prototype.GetCenter = function() {
    return {x: this._centerX, y: this._centerY};
}

/**
 * Set view's size
 *
 * @param {number} width  Desired width of the view
 * @param {number} height Desired height of the view
 */
cf.View.prototype.SetSize = function(width, height) {
    this._width                  = width;
    this._height                 = height;
    this._matrixUpdated          = false;
    this._invMatrixUpdated       = false;
    this._transformedRectUpdated = false;
}

/**
 * Get view's size
 *
 * @return {Object} The dimensions of the view
 */
cf.View.prototype.GetSize = function() {
    return {width: this._width, height: this._height};
}

/**
 * Set view's rotation
 *
 * @param {number} degree Desired rotation of the view, in degrees
 */
cf.View.prototype.SetRotation = function(degree) {
    this._rotation               = degree % 360;
    this._matrixUpdated          = false;
    this._invMatrixUpdated       = false;
    this._transformedRectUpdated = false;
}

/**
 * Get view's rotation
 *
 * @return {number} The rotation of the view, in degrees
 */
cf.View.prototype.GetRotation = function() {
    return this._rotation;
}

/**
 * Returns an updated view's matrix
 *
 * @return {Object} The updated view's matrix
 */
cf.View.prototype._getMatrix = function() {
    if(!this._matrixUpdated) {
        this._matrix = cf.Matrix3.Transformation( this._centerX,
                                                  this._centerY,
                                                  this._pWidth/2,
                                                  this._pHeight/2, 
                                                 -this._rotation,
                                                  this._pWidth/this._width,
                                                  this._pHeight/this._height);
        this._matrixUpdated = true;
    }
    
    return this._matrix;
}

/**
 * Returns an AABB bounding box of the view
 *
 * @return {Object} The AABB bounding box
 */
cf.View.prototype.GetTransformedRect = function() {
    // An AABB Box only changes when scaled or rotated
    if(!this._transformedRectUpdated && this._rotation != 0) {
        // Calculate rectangle corners
        var left   = this._centerX - this._width/2,
            top    = this._centerY - this._height/2,
            right  = left + this._width,
            bottom = top  + this._height;
        
        // Transform the points by the matrix    
            pt1 = this._getMatrix().Transform(left,  top),
            pt2 = this._getMatrix().Transform(right, top),
            pt3 = this._getMatrix().Transform(right, bottom),
            pt4 = this._getMatrix().Transform(left,  bottom);
        
        // A bounding rect is actually the most extreme values
        this._transformedRect = {
            left:   Math.min(pt1.x, pt2.x, pt3.x, pt4.x),
            right:  Math.max(pt1.x, pt2.x, pt3.x, pt4.x),
            top:    Math.min(pt1.y, pt2.y, pt3.y, pt4.y),
            bottom: Math.max(pt1.y, pt2.y, pt3.y, pt4.y)
        };
        
        this._transformedRectUpdated = false;
        
    }
    else if(!this._transformedRectUpdated) {
        this._transformedRect = {
            left:   this._centerX - this._width /2,
            top:    this._centerY - this._height/2,
            right:  this._centerX + this._width /2,
            bottom: this._centerY + this._height/2
        };
                    
        this._transformedRectUpdated = false;
    }
    
    return this._transformedRect;
}

/**
 * Returns an updated view's inverse matrix
 *
 * @return {Object} The updated view's inverse matrix
 */
cf.View.prototype._getInvMatrix = function() {
    if(!this._invMatrixUpdated) {
        this._invMatrix = this._getMatrix().Inverse();
        this._invMatrixUpdated = true;
    }

    return this._invMatrix;
}

//------------------------------------------------------------------------------

/**
 * A canvas rendering element
 * @constructor
 *
 * @param {number} width  Width of the canvas
 * @param {number} height Height of the canvas
 */
cf.RenderTarget = function(width, height) {
    
    this._canvas        = document.createElement('canvas');
    
    if(!this._canvas.getContext) return; // Check if canvas is supported
    this._ctx           = this._canvas.getContext('2d');
    this._canvas.width  = this.Width  = width;
    this._canvas.height = this.Height = height;
    
    this.DefaultView    = new cf.View(this.Width, this.Height);
    this._view          = this.DefaultView;
    
    /** @type {Object} */
    this.ClipShape      = null;
}

/**
 * Returns the current view
 *
 * @return {Object} The current view
 */
cf.RenderTarget.prototype.GetView = function() {
    return this._view;
}

/**
 * Sets a view for the RenderTarget
 *
 * @param {null|Object=} view The view to be set
 */
cf.RenderTarget.prototype.SetView = function(view) {
    this._view = view || this.DefaultView;
}

/**
 * Draws an element on the canvas
 *
 * @param {Object} element  Element to draw
 */
cf.RenderTarget.prototype.Draw = function(element) {
    // Check if there's an element to draw
    if(!element || !element._render) return;
    
    var ctx = this._ctx;
    
    // Setup clipping, not affected by the view's transformations
    if(this.ClipShape && this.ClipShape.Path) {
        // Set transformations
        this.ClipShape._getMatrix().Set(ctx);
        
        // Draw the path
        ctx.beginPath();
        this.ClipShape.Path(ctx);
        ctx.closePath();
        
        // Clip it
        ctx.clip();
    }
    
    // Set view's transformation matrix
    var m = this._view._getMatrix();
    m.Set(ctx);
    
    // Setup shadow
    if(element.ShadowBlur) {
        // Calculate the transformed offset of the 
        var em     = element._getMatrix(),
            pos    = element.GetPosition(),
            tpos   = m.Transform(pos.x, pos.y),
            etpos  = em.Transform(pos.x, pos.y),
            epos   = em.Transform(- pos.x - element.ShadowOffsetX,
                                  - pos.y - element.ShadowOffsetY),
            offset = m.Transform(3 * pos.x - etpos.x - epos.x,
                                 3 * pos.y - etpos.y - epos.y);
        
        ctx.shadowBlur = element.ShadowBlur;
        ctx.shadowColor = element.ShadowColor;
        ctx.shadowOffsetX = offset.x - tpos.x;
        ctx.shadowOffsetY = offset.y - tpos.y;
    }

    // Draw the element
    element._render(ctx);
}

/**
 * Clears the surface
 *
 * @param {Object=} style Clearing color/gradiant
 */
cf.RenderTarget.prototype.Clear = function(style) {
    var ctx = this._ctx;
    if(0 in arguments) { //then they passed a style
        ctx.save();                
        ctx.fillStyle = style;
        ctx.fillRect(0, 0, this.Width, this.Height);
        ctx.restore();
    }
    else {
        ctx.clearRect(0, 0, this.Width, this.Height);
    }
}

/**
 * Converts a point relative to <canvas> to a point relative to the view
 *
 * @param {number}  x    X coordinate of the point
 * @param {number}  y    Y coordinate of the point
 * @param {Object=} view The target view, sets to the current view if not set
 */
cf.RenderTarget.prototype.ConvertCoords = function(x, y, view) {
    if(!view) view = this.GetView();
    return view._getInvMatrix().Transform(x, y);
}

//------------------------------------------------------------------------------

/**
 * A Render target but with container and events handling
 * @constructor
 *
 * @param {Object}  container The parent DOM element
 * @param {number=} width     Width of the canvas (takes parent's if not set)
 * @param {number=} height    Height of the canvas (takes parent's if not set)
 */
cf.Window = function(container, width, height) {

    var canvas        = this._canvas,
        offsetX       = 0,
        offsetY       = 0,
        _this         = this;
        
    if(typeof width  != 'number') width   = container.clientWidth;
    if(typeof height != 'number') height  = container.clientHeight;
    
    this.Width            = canvas.width  = width;
    this.Height           = canvas.height = height;
    this.FrameCount       = 0;
    this.DesiredFrameTime = 1e3/60;
    this.Loop             = true;
    
    // Events related
    this.MouseX        = 0;
    this.MouseY        = 0;
    this.MousePressed  = false;
    this.PMouseX       = undefined;
    this.PMouseY       = undefined;
    this.Key           = undefined;
    this.KeyCode       = undefined;
    this.KeysDown      = {};
    
    // Private
    this._actualFrameTime = 0;
        
    function getOffset() {
		var obj = canvas,
		    x   = 0,
		    y   = 0;
		    
		while(obj) {
			y  += obj.offsetTop;
			x  += obj.offsetLeft;
			obj = obj.offsetParent;
		}
		
		offsetX = x;
		offsetY = y;
    }
        
    function updateMousePosition(e) {
        var x = e.pageX - offsetX;
        var y = e.pageY - offsetY;
        
        if(_this.PMouseX == undefined) {
			_this.PMouseX = x;
			_this.PMouseY = y;
		}
		else { 
			_this.PMouseX = _this.MouseX;
			_this.PMouseY = _this.MouseY;
		}
		
		_this.MouseX = x;
		_this.MouseY = y;    
    }
    
	window.addEventListener('resize', getOffset, false);
    
    canvas.addEventListener('mouseover', this.MouseOver, false);
    canvas.addEventListener('mouseout',  this.MouseOut,  false);
    
    canvas.addEventListener('mousemove', updateMousePosition, false);
    canvas.addEventListener('mousemove', this.MouseMove, false);
    
    
    canvas.addEventListener('mousedown', function(e) {
        _this.MousePressed = true;
        _this.MouseDown();
        canvas.addEventListener('mousemove', this.MouseDrag, false);
		canvas.removeEventListener('mousemove', this.MouseMove, false);
    }, false);
    
    canvas.addEventListener('mouseup',   function(e) {
        _this.MousePressed = false;
        _this.MouseUp();
		canvas.removeEventListener('mousemove', this.MouseDrag, false);
        canvas.addEventListener('mousemove', this.MouseMove, false);
    }, false);
    
    window.addEventListener('keydown',   function(e) {
		var kc = e.keyCode;
		_this.Key = String.fromCharCode(kc);
		_this.KeyCode = kc;
		_this.KeysDown[kc] = true;
		_this.KeyDown();
	}, true);

	window.addEventListener('keyup',     function(e) {
		var kc = e.keyCode;
		_this.Key = String.fromCharCode(kc);
		_this.KeyCode = kc;
		_this.KeysDown[kc] = false;
		_this.KeyUp();
	}, true);
	
	// Add the canvas to the container and update offset
    container.appendChild(canvas);
    getOffset();
    
    var requestAnimationFrame = (function() {
        return window['requestAnimationFrame']       || 
               window['webkitRequestAnimationFrame'] || 
               window['mozRequestAnimationFrame']    || 
               window['oRequestAnimationFrame']      || 
               window['msRequestAnimationFrame']     || 
               function(callback) {
                   window.setTimeout(callback, _this._actualFrameTime);
               };
    })();
    
    var display = function() {
        _this.FrameCount++;

        var prev = new Date().getTime();

        _this.Display();

        var delta = new Date().getTime() - prev;

        if(delta > _this.DesiredFrameTime) { 
	        _this._actualFrameTime = delta;
        }
        else {
	        _this._actualFrameTime = _this.DesiredFrameTime;
        }

        if(_this.Loop) {
	        requestAnimationFrame(display);
        }
    };

    display();
}

// Inherits from cf.RenderTarget
cf.Window.prototype = new cf.RenderTarget(0, 0);

/**
 * Return the current frame rate
 */

cf.Window.prototype.GetFPS = function() {
    return 1e3/this._actualFrameTime;
}

/**
 * Events virtual functions
 */
cf.Window.prototype.MouseOver = function() {};
cf.Window.prototype.MouseOut  = function() {};
cf.Window.prototype.MouseDown = function() {};
cf.Window.prototype.MouseUp   = function() {};
cf.Window.prototype.MouseMove = function() {};
cf.Window.prototype.MouseDrag = function() {};
cf.Window.prototype.KeyDown   = function() {};
cf.Window.prototype.KeyUp     = function() {};
cf.Window.prototype.Display   = function() {};

//------------------------------------------------------------------------------

/**
 * A drawable element on a surface
 * @constructor
 */
cf.Drawable = function() {
    this._posX             = 0;
    this._posY             = 0;
    this._scaleX           = 1;
    this._scaleY           = 1;
    this._originX          = 0;
    this._originY          = 0;
    this._skewX            = 0;
    this._skewY            = 0;
    this._rotation         = 0;
    
    this._matrix           = null;
    this._invMatrix        = null;
    this._matrixUpdated    = false;
    this._InvMatrixUpdated = false;
    
    // Public attributes
    this.Alpha             = 1;
    this.ShadowBlur        = 0;
    this.ShadowOffsetX     = 0;
    this.ShadowOffsetY     = 0;
    this.ShadowColor       = '#000';
    this.Composite         = 'source-over';
}

/**
 * A virtual function automatically called when the transformation matrix may
 * change
 */
cf.Drawable.prototype._transformed = function() {
    // virtual
}

/**
 * Set the origin of the transformations
 *
 * @param {number|Object} x X coordinate of center OR a {x, y} Object
 * @param {number=}       y Y coordinate of the center relative to the element
*/
cf.Drawable.prototype.SetOrigin = function(x, y) {
    if(typeof x == 'object') {
        y = x.y;
        x = x.x;
    }
    
    this._originX = x || 0;
    this._originY = y || 0;

    this._matrixUpdated    = false;
    this._InvMatrixUpdated = false;
    this._transformed();
}

/**
 * Get the origin of the transformations
 *
 * @return {Object} Coordinates of the origin of the transformations
 */
cf.Drawable.prototype.GetOrigin = function() {
    return {x: this._originX, y: this._originY};
}

/**
 * Set the position of the element
 *
 * @param {number|Object}  x X coordinate OR a {x, y} Object
 * @param {number=}        y Y coordinate of the origin of the element
*/
cf.Drawable.prototype.SetPosition = function(x, y) {
    if(typeof x == 'object') {
        y = x.y;
        x = x.x;
    }
    
    this._posX = x || 0;
    this._posY = y || 0;
    
    this._matrixUpdated    = false;
    this._InvMatrixUpdated = false;
    this._transformed();
}

/**
 * Get the position of the element
 *
 * @return {Object} Coordinates of the origin of the element
 */
cf.Drawable.prototype.GetPosition = function() {
    return {x: this._posX, y: this._posY};
}

/**
 * Move the element relatively from its current position
 *
 * @param {number|Object} x X shift OR a {x, y} Object
 * @param {number=}       y Y shift of the element
*/
cf.Drawable.prototype.Move = function(x, y) {
    if(typeof x == 'object') {
        y = x.y;
        x = x.x;
    }
    
    this.SetPosition(this._posX + x, this._posY + y);
}

/**
 * Set the scale of the element
 *
 * @param {number|Object}  x Horizontal scale  OR a {x, y} object
 * @param {number=}        y Vertical scale relative to the origin
*/
cf.Drawable.prototype.SetScale = function(x, y) {
    if(typeof x == 'object') {
        y = x.y;
        x = x.x;
    }
    
    this._scaleX = x || 0;
    this._scaleY = y || 0;

    this._matrixUpdated    = false;
    this._InvMatrixUpdated = false;
    this._transformed();
}

/**
 * Get the scale of the element
 *
 * @return {Object} Scale factors of the element
 */
cf.Drawable.prototype.GetScale = function() {
    return {x: this._scaleX, y: this._scaleY};
}

/**
 * Scale the element relatively from its current position
 *
 * @param {number|Object} x Horizontal scale factor OR a {x, y} object
 * @param {number=}       y Vertical scale factor
*/
cf.Drawable.prototype.Scale = function(x, y) {
    if(typeof x == 'object') {
        y = x.y;
        x = x.x;
    }
    
    this.SetScale(this._scaleX * (x||1), this._scaleY * (y||1));
}

/**
 * Set the skew of the element
 *
 * @param {number|Object} x Horizontal skew degree OR a {x, y} object
 * @param {number=}       y Vertical skew degree of the element
*/
cf.Drawable.prototype.SetSkew = function(x, y) {
    if(typeof x == 'object') {
        y = x.y;
        x = x.x;
    }
    
    this._skewX = (x || 0) % 360;
    this._skewY = (y || 0) % 360;
    
    this._matrixUpdated    = false;
    this._InvMatrixUpdated = false;
    this._transformed();
}

/**
 * Get the skew of the element
 *
 * @return {Object} Skew degrees of the element
 */
cf.Drawable.prototype.GetSkew = function() {
    return {x: this._skewX, y: this._skewY};
}


/**
 * Skew the element relatively
 *
 * @param {number|Object}  x Horizontal skew relative degree or a {x, y} object
 * @param {number=}        y Vertical skew degree  relative to its current skew
*/
cf.Drawable.prototype.Skew = function(x, y) {
    if(typeof x == 'object') {
        y = x.y;
        x = x.x;
    }
    
    this.SetScale(this._skewX + x, this._skewY + y);
}

/**
 * Set the orientation of the element
 *
 * @param {number} angle Angle of rotation, in degrees
 */
cf.Drawable.prototype.SetRotation = function(angle) {
    this._rotation = angle % 360;
    
    this._matrixUpdated    = false;
    this._InvMatrixUpdated = false;
    this._transformed();
}

/**
 * Get the current orientation of the element
 * The rotation is always in the range [0, 360]
 *
 * @return {number} Current rotation, in degrees
 */
cf.Drawable.prototype.GetRotation = function() {
    return this._rotation;
}

/**
 * Set the orientation of the element relatively to its current rotation
 *
 * @param {number} angle Relative angle of rotation, in degrees
 */
cf.Drawable.prototype.Rotate = function(angle) {
    this.SetRotation(this._rotation + angle);
}

/**
 * Get updated transformation matrix
 * @protected
 *
 * @return {Object} An updated matrix
 */
cf.Drawable.prototype._getMatrix = function() {
    if(!this._matrixUpdated) {
        this._matrix = cf.Matrix3.Transformation(this._originX,
                                                 this._originY,
                                                 this._posX,
                                                 this._posY,
                                                 this._rotation,
                                                 this._scaleX,
                                                 this._scaleY,
                                                 this._skewX,
                                                 this._skewY);
        this._matrixUpdated = true;
    }
    
    return this._matrix;
}

/**
 * Get updated inversed transformation matrix
 * @protected
 *
 * @return {Object} An updated inverse matrix
 */
cf.Drawable.prototype._getInvMatrix = function() {
    if(!this._invMatrixUpdated) {
        this._invMatrix        = this._getMatrix().Inverse();
        this._invMatrixUpdated = true;
    }
    
    return this._invMatrix;
}

/**
 * Transform a point in object local coordinates
 *
 * @param {number|Object}  x X coordinate of the point or a {x, y} object
 * @param {number=}        y Y coordinate of the point to transform
 * @return {Object} New coordinates of the point transformed
 */
cf.Drawable.prototype.TransformToLocal = function(x, y) {
    // Get the object as simple coordinates
    if(typeof x == 'object') {
        y = x.y;
        x = x.x;
    }
    
    // Transform
    return this._getInvMatrix().Transform(x, y);
}

/**
 * Transform a local point in global coordinates
 *
 * @param {number|Object}  x X coordinate of the point or a {x, y} object
 * @param {number=}        y Y coordinate of the point to transform
 * @return {Object} New coordinates of the point transformed
 */
cf.Drawable.prototype.TransformToGlobal = function(x, y) {
    // Get the object as simple coordinates
    if(typeof x == 'object') {
        y = x.y;
        x = x.x;
    }
    
    // Transform
    return this._getMatrix().Transform(x, y);
}

/**
 * Draw the object on the context
 *
 * @param {Object} ctx A reference to Canvas's context object
 */
cf.Drawable.prototype._render = function(ctx) {
    if(!this.Alpha) return; // Nothing's gonna be drawn anyway
    
    ctx.save(); // Save current context state
    
    // Apply the (updated) transformations matrix
    this._getMatrix().Apply(ctx);
    
    // Setup alpha and compositing
    ctx.globalAlpha = this.Alpha;
    ctx.globalCompositeOperation = this.Composite;
    
    this.Draw(ctx);
    
    ctx.restore(); // Restore previous context state
}

//------------------------------------------------------------------------------

/**
 * Handles image drawing on the canvas
 * @constructor
 *
 * @param {Object=} image  The PRELOADED image associated to the sprite
 * @param {number=} posX   The X Coordinate of the element
 * @param {number=} posY   The Y Coordinate of the element
 * @param {number=} scaleX The horizontal scale of the element
 * @param {number=} scaleY The vertical scale of the element
 * @param {number=} rot    The rotation of the element
 * @param {number=} skewX  The horizontal skew of the element
 * @param {number=} skewY  The vertical skew of the element
 */
cf.Sprite = function(image, posX, posY, scaleX, scaleY, rot, skewX, skewY) {
    this._subrect                = new cf.Rect();
    this._transformedRect        = new cf.Rect();
    this._transformedRectUpdated = false;
    
    /** @type {Object} @private */
    this._image = null;
    
    this.SetImage(image);
    
    this.SetPosition(posX||0, posY||0);
    this.SetScale(scaleX||1, scaleY||1);
    this.SetRotation(rot||0);
    this.SetSkew(skewX||0, skewY||0);
}

// Inherits from cf.Drawable
cf.Sprite.prototype = new cf.Drawable;

/**
 * Indicates that transformations have been made and we need to update
 * the AABB rect
 */
cf.Sprite.prototype._transformed = function() {
    this._transformedRectUpdated = false;
}

/**
 * Set the visible region of the image. If the visible region is bigger than
 *  the image, the image repeats to fill the blanks
 *
 * @param {number|Object} left   A cf.Rect of the left coordinate of the region
 * @param {number=}       top    The top coordinate of the region
 * @param {number=}       width  The width of the visible region
 * @param {number=}       height The height of the visible region
 */
cf.Sprite.prototype.SetSubrect = function(left, top, width, height) {
    if(typeof left == 'object') {
        this._subrect = left;
    }
    else {
        this._subrect.Left   = left;
        this._subrect.Top    = top;
        this._subrect.Width  = width;
        this._subrect.Height = height;
    }
    
    this._transformedRectUpdated = false;
}

/**
 * Get the visible region of the image
 *
 * @return {Object} A rectangle representing the visible area of the image
 */
cf.Sprite.prototype.GetSubrect = function() {
    return this._subrect;
}

/**
 * Associate an image to the sprite
 * 
 * @param {Object=}  image      The PRELOADED image to associate to the sprite
 * @param {boolean=} updateRect Update the subrect to meet the image's size
 */
cf.Sprite.prototype.SetImage = function(image, updateRect) {
    // If no image given, remove the current one
    if(!image) return this._image = null;

    // If updateRect is not given, set it to false
    if(!(1 in arguments)) updateRect = false;
    
    // If the image is not a <img> but actually a cf.RenderTarget
    if(image._canvas) {
        image = image._canvas;
    }    
    
    // Update the subrect
    if(this._image == null || updateRect) {
        this.SetSubrect(0, 0, image.width, image.height);
    }
    
    this._image = image;
}

/**
 * Get the image associated to the rect
 *
 * @return {Object} The image associated to the rect
 */
cf.Sprite.prototype.GetImage = function() {
    return this._image;
}

/**
 * Get an AABB bounding box of the sprite
 *
 * @param {boolean=} relative Should the AABB box be relative to the sprite ?
 * @return {Object} The AABB bounding box
 */
cf.Sprite.prototype.GetTransformedRect = function(relative) {
    if(!this._transformedRectUpdated) {
        var rect = this._subrect,
            v    = this._transformedRect,
            m    = this._getMatrix(),
            
        // Transform points
            pt1  = m.Transform(0,          0),
            pt2  = m.Transform(rect.Width, 0),
            pt3  = m.Transform(rect.Width, rect.Height),
            pt4  = m.Transform(0,          rect.Height);
            
        // Take only the extreme points of each corner
        v.Left   = Math.min(pt1.x, pt2.x, pt3.x, pt4.x);
        v.Top    = Math.min(pt1.y, pt2.y, pt3.y, pt4.y);
        v.Width  = Math.max(pt1.x, pt2.x, pt3.x, pt4.x) - v.Left;
        v.Height = Math.max(pt1.y, pt2.y, pt3.y, pt4.y) - v.Top;
        
        this._transformedRectUpdated = true;   
    }
    
    if(relative) {
        var rect   = this._transformedRect,
            pos    = this.GetPosition();
        
        return new cf.Rect(rect.Left - pos.x,
                           rect.Top - pos.y,
                           rect.Width,
                           rect.Height);
    } else {
        return this._transformedRect;
    }
}

/**
 * Draw the sprite on the Canvas
 *
 * @param {Object} ctx A reference to the Canvas context
 */
cf.Sprite.prototype.Draw = function(ctx) {
    var rect = this._subrect;
    
    // May cause error if there's no image
    if(!this._image || !rect.Width || !rect.Height) return;

    if(rect.Left+rect.Width > this._image.width ||
       rect.Top + rect.Height > this._image.height) {
        // Draw a clipping region, to fit with the subrect
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(rect.Width, 0);
        ctx.lineTo(rect.Width, rect.Height);
        ctx.lineTo(0, rect.Height);
        ctx.closePath();
        ctx.clip();
        
        // Necessary translate since patterns are fix to the canvas
        ctx.translate(-rect.Left, -rect.Top);
        
        // Draw the "tiles"
        ctx.fillStyle = ctx.createPattern(this._image, 'repeat');
        ctx.fillRect(0, 0, rect.Width + rect.Left, rect.Height + rect.Top);
       
    } else {
        ctx.drawImage(this._image,
                      rect.Left,
                      rect.Top,
                      rect.Width,
                      rect.Height,
                      0,
                      0,
                      rect.Width,
                      rect.Height);
    }
}

//------------------------------------------------------------------------------

/**
 * A class that handles drawing text on the canvas
 * @constructor
 *
 * @param {string=} str    The text to draw
 * @param {number=} size   Text size
 * @param {string=} font   Font of the text
 * @param {number=} posX   Horizontal position on the screen
 * @param {number=} posY   Vertical position on the screen
 * @param {number=} scaleX Horizontal scale of the text
 * @param {number=} scaleY Vertical scale of the text
 * @param {number=} rot    Rotation of the text, in degrees
 * @param {number=} skx    Horizontal skew of the element, in degrees
 * @param {number=} sky    Vertical skew of the element, in degrees
 */
 
cf.Text = function(str, size, font, posX, posY, scaleX, scaleY, rot, skx, sky) {
    this._string      = str  || '';
    this._font        = font || 'sans-serif';
    this._fontSize    = size || 16;
    this._stroke      = false;
    this._strokeWidth = 1;
    
    this._rect        = new cf.Rect();
    this._rectUpdated = false;
    
    this._transformedRect        = new cf.Rect();
    this._transformedRectUpdated = false;
    
    this.Fill           = true;
    this.Color          = '#000';
    this.LineCap        = 'butt';
    this.LineJoin       = 'mitter';
    this.StrokeColor    = '#000';
    this.FillOverStroke = false;
    this.Style          = '';
    
    this._offsetX = 0;
    this._offsetY = 0;
    
    this.SetPosition(posX||0,   posY||0);
    this.SetScale   (scaleX||1, scaleY||1);
    this.SetSkew    (skx||0,    sky||0);
    this.SetRotation(rot||0);
}

// Inherits from cf.Drawable
cf.Text.prototype = new cf.Drawable;

/**
 * Set the text to draw
 *
 * @param {string} str The text to draw
 */
cf.Text.prototype.SetString = function(str) {
    this._string = str || '';
    
    this._rectUpdated            = false;
    this._transformedRectUpdated = false;
}

/**
 * Get the text currently drawing
 *
 * @return {string} The text that currently draws on the screen
 */
cf.Text.prototype.GetString = function() {
    return this._string;
}

/**
 * Set the font of the text
 *
 * @param {string} font The font of the text
 */
cf.Text.prototype.SetFont = function(font) {
    this._font = font || 'sans-serif';
    
    this._rectUpdated            = false;
    this._transformedRectUpdated = false;
}

/**
 * Get the font of the text
 *
 * @return {string} The current font of the text
 */
cf.Text.prototype.GetFont = function() {
    return this._font;
}

/**
 * Set the size of the text
 *
 * @param {number} size The size of the text, in pixels
 */
cf.Text.prototype.SetFontSize = function(size) {
    this._fontSize = size;
    
    this._rectUpdated            = false;
    this._transformedRectUpdated = false;
}

/**
 * Get the size of the text
 *
 * @return {number} The current pixel size of the text
 */
cf.Text.prototype.GetFontSize = function() {
    return this._fontSize;
}

/**
 * Set the width of the text's stroke
 *
 * @param {number} width The width of the text's stroke
 */
cf.Text.prototype.SetStrokeWidth = function(width) {
    this._strokeWidth = width;
    
    this._rectUpated             = false;
    this._transformedRectUpdated = false;
}

/**
 * Get the width of the text's stroke
 *
 * @return {number} The current width of the stroke
 */
cf.Text.prototype.GetStrokeWidth = function() {
    return this._strokeWidth;
}

/**
 * Indicate whether to draw or not the stroke
 *
 * @param {boolean} draw True if the stroke must be drawn, False if not
 */
cf.Text.prototype.DrawStroke = function(draw) {
    this._stroke = draw || true;
    
    this._rectUpated             = false;
    this._transformedRectUpdated = false;
}

/**
 * Get the bounding rect of the text
 *
 * @return {Object} A cf.Rect that's the border of the text
 */
cf.Text.prototype.GetRect = function() {
    if(!this._rectUpdated) {
    
        // Make a new context
        var d = document.createElement('canvas');
        if(!d.getContext) return null;
        var ctx = d.getContext('2d');
        ctx.font = this.Style + ' ' + this._fontSize + 'px ' + this._font;
        
        // Calculate base size
        var left = 0,
            top = 0,
            width = ctx.measureText(this._string).width,
            height = this._fontSize;
        
        // Add stroke width
        if(this._stroke && strokeWidth) {
            left = top -= this._strokeWidth / 2;
            width += this._strokeWidth;
            height += this._strokeWidth;
        }
        
        // Update values
        this._rect = new cf.Rect(left, top, width, height);
        this._rectUpdated = true;
    }
    
    return this._rect;
}

/**
 * Draw the text on the screen
 *
 * @param {Object} ctx A reference to the Canvas's context to draw onto
 */
cf.Text.prototype.Draw = function(ctx) {
    if(!this._string || this._string == '' || (!this._stroke && !this.Fill))
        return;
    
    // From the bottom to get extra height counted in Rect calculation
    ctx.textBaseline = 'bottom';
    ctx.font = this.Style + ' ' + this._fontSize + 'px ' + this._font;
    
    if(this._stroke && strokeWidth) {
        ctx.strokeStyle = this.StrokeColor;
        ctx.lineWidth   = this._strokeWidth;
        ctx.lineCap     = this.LineCap;
        ctx.lineJoin    = this.LineJoin;
    }
    
    // Filling parameters
    if(this.Fill) {
        ctx.fillStyle = this.Color;
    }
    
    // Transparent text won't do, need to offset text
    var offsetX = this._offsetX,
        offsetY = this._offsetY;
        
    // When shadow is setup as blur, it isn't draw when blur equals zero        
    if(!this.ShadowBlur) {
        offsetX = 0;
        offsetY = 0;
    }
    
    // Draw the text
    if(this._stroke && strokeWidth && this.FillOverStroke)
        ctx.strokeText(this._string, offsetX, this._fontSize + offsetY);
    if(this.Fill)
        ctx.fillText(this._string, offsetX, this._fontSize + offsetY);
    if(this._stroke && strokeWidth && !this.FillOverStroke)
        ctx.strokeText(this._string, offsetX, this._fontSize + offsetY);
}

/** 
 * Called when the text is transformed
 */
cf.Text.prototype._transformed = function() {
    this._transformedRectUpdated = false;
}

/**
 * Get an AABB bounding box of the text
 *
 * @param {boolean=} relative Should the AABB box be relative to the text ?
 * @return {Object} The AABB bounding box
 */
cf.Text.prototype.GetTransformedRect = function(relative) {
    if(!this._transformedRectUpdated) {
        var rect = this.GetRect(),
            v    = this._transformedRect,
            m    = this._getMatrix(),
            
        // Transform points
            pt1 = m.Transform(0,          0),
            pt2 = m.Transform(rect.Width, 0),
            pt3 = m.Transform(rect.Width, rect.Height),
            pt4 = m.Transform(0,          rect.Height);
        
        // Take only the extreme points of each corner
        v.Left   = Math.min(pt1.x, pt2.x, pt3.x, pt4.x);
        v.Top    = Math.min(pt1.y, pt2.y, pt3.y, pt4.y);
        v.Width  = Math.max(pt1.x, pt2.x, pt3.x, pt4.x) - v.Left;
        v.Height = Math.max(pt1.y, pt2.y, pt3.y, pt4.y) - v.Top;
        
        this._transformedRectUpdated = true;   
    }
    
    if(relative) {
        var rect   = this._transformedRect,
            pos    = this.GetPosition();
        
        return new cf.Rect(rect.Left - pos.x,
                           rect.Top - pos.y,
                           rect.Width,
                           rect.Height);
    } else {
        return this._transformedRect;
    }
}

/**
 * Hides the text so that the shadow might appear as a blurry text
 *
 * @param {boolean=} blur Activate blur or not
 */
cf.Text.prototype.SetupShadowAsBlur = function(blur) {
    if(blur) {
        this._offsetX = -99999;
        this._offsetY = -99999;
        this.ShadowOffsetX = 99999;
        this.ShadowOffsetY = 99999;
    }
    else {
        this._offsetX = 0;
        this._offsetY = 0;
        this.ShadowOffsetX = 0;
        this.ShadowOffsetY = 0;
    }
};

//------------------------------------------------------------------------------

/**
 * Shape
 * @constructor
 *
 * @param {Function=} pathFunc
 * @param {number=} posX
 * @param {number=} posY
 * @param {number=} scaleX
 * @param {number=} scaleY
 * @param {number=} rot
 */
 
cf.Shape = function(pathFunc, posX, posY, scaleX, scaleY, rot) {
    // Public attributes
    this.LineColor      = "#000";
    this.LineWidth      = 1;
    this.LineCap        = 'butt';
    this.LineJoin       = 'mitter';
    this.FillColor      = '#000';
    this.FillOverStroke = false;
    this.Stroke         = false;
    this.Fill           = true;
    
    if(pathFunc) this.Path = pathFunc;
    
    this.SetPosition(posX||0, posY||0);
    this.SetScale(scaleX||1, scaleY||1);
    this.SetRotation(rot||0);
}

cf.Shape.prototype = new cf.Drawable;

cf.Shape.prototype.Path = function(ctx) {};

cf.Shape.prototype.Draw = function(ctx) {
    if((!this.Fill && !this.Stroke) || !this.Path) return;
    
    if(this.Stroke) {
        ctx.strokeStyle = this.LineColor;
        ctx.lineWidth   = this.LineWidth;
        ctx.lineCap     = this.LineCap;
        ctx.lineJoin    = this.LineJoin;
    }
    
    // Filling parameters
    if(this.Fill) {
        ctx.fillStyle = this.FillColor;
    }
    
    // Draw the path
    ctx.beginPath();
    this.Path(ctx);
    ctx.closePath();
    
    // Render the path
    if(this.Stroke && this.FillOverStroke) ctx.stroke();
    if(this.Fill) ctx.fill();
    if(this.Stroke && !this.FillOverStroke) ctx.stroke();
}

cf.Shape.prototype.IsPointInside = function(x, y) {

    // Make a new context
    var d = document.createElement('canvas');
    if(!d.getContext) return false;
    var ctx = d.getContext('2d');
    
    // Get the object as simple coordinates
    if(!(1 in arguments)) {
        y = x.y;
        x = x.x;
    }
    
    // Draw the path
    ctx.beginPath();
    this.Path(ctx);
    ctx.closePath();
    
    // Check if the point is inside, natively
     return ctx.isPointInPath(x, y);
}

/**
 * Create a Rectangle shape
 *
 * @param {number|Object=} x      A cf.Rect or Left coordinate of the rect
 * @param {number=}        y      Top coordinate of the rect
 * @param {number=}        width  Width of the rectangle
 * @param {number=}        height Height of the rectangle
 */
cf.Shape.Rect = function(x, y, width, height) {
    if(typeof x != 'object') {
        x = new cf.Rect(x||0, y||0, width||0, height||0);
    }
    
    var shape  = new cf.Shape();
    shape.Rect = x;
    shape.Path = function(ctx) {
        var rect = shape.Rect;
        ctx.rect(rect.Left, rect.Top, rect.Width, rect.Height);
    };
    
    return shape;
}

/**
 * Create a circle shape
 *
 * @param {number}         radius The radius of the circle
 * @param {number|Object=} x      {x, y} OR Horizontal coordinate of the center
 * @param {number=}        y      Vertical coordinate of the center
 */
cf.Shape.Circle = function(radius, x, y) {
    if(typeof x != 'object') {
        x = {x: x||0, y: y||0};
    }
    
    var shape  = new cf.Shape();
    shape.Center = x;
    shape.Radius = radius||0;
    shape.Path = function(ctx) {
        var center = shape.Center;
        ctx.arc(center.x, center.y, shape.Radius, 0, 6.283185307179586, true);
    };
    
    return shape;
}

//------------------------------------------------------------------------------

/**
 * Handles retrieving pixel data from an image
 * @constructor
 *
 * @param {Object=} image The image to load data from
 */
cf.DataImage = function(image) {
    this._data  = [];
    this.Width  = 0;
    this.Height = 0;
    
    // Load image if passed as argument
    if(0 in arguments) this.LoadImage(image);
}

/**
 * Load data from an image
 *
 * @param {Object=} image A PRELOADED image to load data from
 */
cf.DataImage.prototype.LoadImage = function(image) {
    // Make a new context
    var d    = document.createElement('canvas');
    if(!d.getContext) return;
    var ctx  = d.getContext('2d');
    d.width  = this.Width  = image.width;
    d.height = this.Height = image.height;
    
    // Draw it onto the context
    ctx.drawImage(image, 0, 0);
    
    // Save data
    this._data = ctx.getImageData(0, 0, d.width, d.height).data;
}

/**
 * Get the color of pixel in the given coordinates
 *
 * @param {number|Object} x The horizontal coordinate of the pixel
 * @param {number=}       y The vertical coordinate of the pixel
 * @return {Object} The color of the given pixel
 */
cf.DataImage.prototype.GetColor = function(x, y) {
    if(!this.Width || !this.Height || !this._data) return null;
    
    if(typeof x == 'object') {
        y = x.y;
        x = x.x;
    }
    
    x %= this.Width;
    y %= this.Height;
    var data   = this._data,
        offset = (y * this.Width + x) * 4;
        
    return {r: data[offset],
            g: data[offset + 1],
            b: data[offset + 2],
            a: data[offset + 3]};
}

/**
 * Get the HEX color of pixel in the given coordinates
 *
 * @param {number|Object} x The horizontal coordinate of the pixel
 * @param {number=}       y The vertical coordinate of the pixel
 * @return {string} The HEXAdecimal color of the given pixel
 */
cf.DataImage.prototype.GetHexColor = function(x, y) {
    var color = this.GetColor(x, y);
    if(!color) return "#FFF";
    var rgb = color.b | (color.g << 8) | (color.r << 16);
    return '#' + rgb.toString(16);
}

//------------------------------------------------------------------------------

/**
 * Handles image masking
 * @constructor
 *
 * @param {Object}    image
 * @param {Function=} drawFunc
 */
cf.MaskImage = function(image, drawFunc) {
    this._target  = new cf.RenderTarget(1, 1);
    this._mask    = null;
    this.Width    = 0;
    this.Height   = 0;
    
    if(drawFunc) this.DrawFunc = drawFunc;
    
    if(image) this.SetMask(image);
}

// Empty virtual function
cf.MaskImage.prototype.DrawFunc = function(target) {};

/**
 * Set the mask of the drawings
 *
 * @param {Object=} image The PRELOADED image used as a mask
 */
cf.MaskImage.prototype.SetMask = function(image) {
    if(!image) return this._mask = null;
        
    // If the image is not a <img> but actually a cf.RenderTarget
    if(image._canvas) {
        image = image._canvas;
    }    
    
    this._mask   = image;
    this.Width   = image.width;
    this.Height  = image.height;
    this._target = new cf.RenderTarget(image.width, image.height);
}

/**
 * Get the masked render
 *
 * @return {Object} A canvas object containing the masked render
 */
cf.MaskImage.prototype.GetImage = function() {
    if(this._mask == null) return null;
    var ctx = this._target._ctx;
    
    ctx.save();
    this.DrawFunc(this._target);
    ctx.restore();
    
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(this._mask, 0, 0);
    
    return this._target._canvas;
}

//------------------------------------------------------------------------------

/**
 * Handles Ajax requests
 * Implemented from Drakware's XMLHTTPRequest http://drakware.com/?e=3
 */
cf.Ajax = {};
cf.Ajax._requests = [];

/**
 * @private
 */
cf.Ajax._createRequest = function() {
    var pos      = -1,
        requests = cf.Ajax._requests;
        
    for(i in requests) {
        if(requests[i].free) {
            pos = i;
            break;
        }
    }
    
    if(pos == -1) {
        pos = requests.length;
        requests[pos] = {free:    true,
                         xmlhttp: null};
        if(window.XMLHttpRequest) {
		    requests[pos].xmlhttp = new XMLHttpRequest();
	    }
	    else if(window.ActiveXObject) {
		    requests[pos].xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	    }
    }
    
    return requests[pos];
}

/**
 * Do a GET request
 *
 * @param {string}  url      The URL of the file to request
 * @param {Function=} callback A function to call when the request is done
 */
cf.Ajax.Get = function(url, callback) {
    var request = cf.Ajax._createRequest(),
        xmlhttp = request.xmlhttp;
    if(!xmlhttp) return;
    
    request.free = false;
    
    xmlhttp.onreadystatechange = function() {
	    if(typeof callback != 'undefined' && xmlhttp.readyState == 4) {
            callback(xmlhttp);
            request.free = true;
        }
    }
    
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

/**
 * Do a POST request
 *
 * @param {string}  url      The URL of the file to request
 * @param {string}  data     Data to send in the POST request
 * @param {Function=} callback A function to call when the request is done
 */
cf.Ajax.Post = function(url, data, callback) {
    var request = cf.Ajax._createRequest(),
        xmlhttp = request.xmlhttp;
    if(!xmlhttp) return;
    
    request.free = false;
    
    xmlhttp.onreadystatechange = function() {
	    if(typeof callback != 'undefined' && xmlhttp.readyState == 4) {
            callback(xmlhttp);
            request.free = true;
        }
    }
    
    xmlhttp.open("POST", url, true);
    xmlhttp.setRequestHeader("Content-Type",
                             "application/x-www-form-urlencoded");
    xmlhttp.send(data);
}

//------------------------------------------------------------------------------

/**
 * Handles the loading of the resources
 * @constructor
 */
cf.ResLoader = function() {
    this._res      = [];
    this._percent  = 0;
    this._loaded   = 0;
    this._total    = 0;
    this._touching = false;
    this._started  = false;
    this._cbcalled = false;
}

/**
 * Get the total of the files current loading
 *
 * @return {number} The total of the files currently loading
 */
cf.ResLoader.prototype.GetTotalFiles = function() {
    return this._total;
}

/**
 * Get the percent of the loading
 * @return {number} The percent representing the progression of the loading
 */
cf.ResLoader.prototype.GetPercent = function() {
    return this._percent;
}

/**
 * Add a file to the loading queue
 *
 * @param {string}  url     URL of the resource to load
 * @param {string=} extType If the resource is not from the same domain, \
 *                          indicate the DOM tag of element.
 */
cf.ResLoader.prototype.Add = function(url, extType) {
    if(1 in arguments) {
        // console.log('Added ' + url + '//');
        this._res.push({url: url, type: extType});
    }
    else {
        // console.log('Added ' + url + '//');
        this._res.push(url);
    }
}

/**
 * Starts loading
 */
cf.ResLoader.prototype.Start = function() {
    if(!this._res.length) return;
    
    this._cbcalled = false;
    this._started  = true;
    this._percent  = this._loaded = 0;
    this._total    = this._res.length;
    
    var _this = this,
        _load = function() {
            // A simple Mutex avoid two functions editing the same
            // value simultaneously
            if(_this._touching) setInterval(this, 10);
            
            _this._touching = true;
            _this._loaded++;
            _this._percent  = _this._loaded/_this._total;
            
            _this._touching = false;
        },
        error = false;
    
    var res;
    while(res = this._res.shift()) {
        if(typeof res == 'object') {
            var d = document.createElement(res.type);
            d.src = res.url;
            
            // Don't use onload or oncanplay, user may replace them
            if(res.type == 'img')
                d.addEventListener('load', _load, false);
            else
                d.addEventListener('canplay', _load, false);
        }
        else if(typeof res == 'string') {
            cf.Ajax.Get(res, function(xmlhttp) {
                _load();
                if(xmlhttp.status != 200) {
                    alert(res + ' couldn\'t be loaded and is ignored,' +
                          ' the application may not function properly');                    
                }
            });
        }
    }
}

/**
 * Utility to simplify loading
 *
 * @param {Function} callback The function to call when loading's finished
 * @return {boolean} True while loading, false when finished
 */
cf.ResLoader.prototype.Loading = function(callback) {
    if(this._cbcalled == true) {
        return false;
    }
    
    if(this._percent === 1) {
        if(callback) callback();
        this._cbcalled = true;
        return false;
    }
    else {
        if(!this._started) this.Start();
        return true;
    }
}

//------------------------------------------------------------------------------

/**
 * Makes a gradiant
 */
cf.Gradiant = function() {
    // TODO
}

//------------------------------------------------------------------------------

// TODO: Add gradiants support
// TODO: Add fullscreen support

//------------------------------------------------------------------------------

