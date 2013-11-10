// Word cloud layout by Jason Davies, http://www.jasondavies.com/word-cloud/
// Algorithm due to Jonathan Feinberg, http://static.mrfeinberg.com/bv_ch03.pdf
/* jshint quotmark: true */
(function(exports) {
  "use strict";
  var d3 = d3 || require("d3");
  function makeCloud() {
    var size = [256, 256],
        imageHref = cloudImageHref,
        imageWidth = cloudImageWidth,
        imageHeight = cloudImageHeight,
        text = cloudText,
        font = cloudFont,
        fontSize = cloudFontSize,
        fontStyle = cloudFontNormal,
        fontWeight = cloudFontNormal,
        rotate = cloudRotate,
        padding = cloudPadding,
        spiral = archimedeanSpiral,
        startPos = centerAreaPos,
        words = [],
        images = [],
        timeInterval = Infinity,
        event = d3.dispatch("placed", "failed", "end"),
        timer = null,
        cloud = {},
        board = zeroArray((size[0] >> 5) * size[1]),
        tags = [],
        bounds = null
        ;

    cloud.start = function() {
      board = zeroArray((size[0] >> 5) * size[1]);
      bounds = null;
      tags = [];

      var i = -1;
      var data = words.map(function(d, i) {
            d.text = text.call(this, d, i);
            d.font = font.call(this, d, i);
            d.style = fontStyle.call(this, d, i);
            d.weight = fontWeight.call(this, d, i);
            d.rotate = rotate.call(this, d, i);
            d.size = ~~fontSize.call(this, d, i);
            d.padding = padding.call(this, d, i);
            return d;
          }).sort(function(a, b) { return b.size - a.size; })
          .concat(images.map(function(d, i) {
            d.rotate = rotate.call(this, d, i);
            d.href = imageHref.call(this, d, i);
            d.imgWidth = imageWidth.call(this, d, i);
            d.imgHeight = imageHeight.call(this, d, i);
            return d;
          })),
          n = data.length;

      if (timer) clearInterval(timer);
      timer = setInterval(step, 0);
      step();

      return cloud;

      function step() {
        var start = +new Date(),
            d;
        while (+new Date() - start < timeInterval && ++i < n && timer) {
          d = data[i];
          cloudSprite(d, cloudContext, data, i);
          if (d.hasText) {
            cloudPlace(d);
          }
        }
        if (i >= n) {
          cloud.stop();
          event.end(tags, bounds);
        }
      }
    };

    function addTag(d) {
      tags.push(d);
      if (bounds) cloudBounds(bounds, d);
      else if (d.visibility !== "hidden") bounds = [{x: d.x + d.x0, y: d.y + d.y0}, {x: d.x + d.x1, y: d.y + d.y1}];

      // Temporary hack
      d.x -= size[0] >> 1;
      d.y -= size[1] >> 1;
    }

    var cloudImg = function (d) {
      var img = new Image();
      img.src = imageHref(d);
      // copy required properities
      return {
        visibility: d.visibility,
        rotate: rotate(d),
        img: img,
        imgWidth: imageWidth(d),
        imgHeight: imageHeight(d)
      };
    };

    // Add more images
    cloud.addImg = function (d) {
      if (typeof d === "string") {
        d = {image: d};
      }
      var tag = cloudImg(d);
      tag.img.onload = function () {
        if (d.size === "auto") {
          // try to fit width first
          tag.imgWidth = size[0] * 0.9;
          tag.imgHeight = tag.imgWidth * this.height / this.width;
          if (tag.imgHeight > size[1] * 0.9) {
            tag.imgHeight = size[1] * 0.9;
            tag.imgWidth = tag.imgHeight * this.width / this.height;
          }
        }
        cloudSprite(tag);
        cloudPlace(tag);
      };
    };

    cloud.stop = function() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      return cloud;
    };

    cloud.timeInterval = function(x) {
      if (!arguments.length) return timeInterval;
      timeInterval = x === null ? Infinity : x;
      return cloud;
    };

    // place tag on board without collision of existing tags but collide on rectangle boundry
    // @return true success
    // @return false failed
    function cloudPlace(tag) {
      var perimeter = [{x: 0, y: 0}, {x: size[0], y: size[1]}],
          maxDelta = Math.sqrt(size[0] * size[0] + size[1] * size[1]),
          s = spiral(size),
          dt = Math.random() < 0.5 ? 1 : -1,
          t = -dt,
          dxdy,
          dx,
          dy;

      startPos(tag, size);
      var startX = tag.x,
          startY = tag.y;

      // Search on spiral for place
      while ((dxdy = s(t += dt))) {
        dx = ~~dxdy[0];
        dy = ~~dxdy[1];

        if (Math.min(dx, dy) > maxDelta) break;

        tag.x = startX + dx;
        tag.y = startY + dy;

        if (tag.x + tag.x0 < 0 || tag.y + tag.y0 < 0 ||
            tag.x + tag.x1 > size[0] || tag.y + tag.y1 > size[1]) continue;
        // TODO only check for collisions within current bounds.
        if (!bounds || !cloudCollide(tag, board, size[0])) {
          // No collission with current board
//          if (!bounds || collideRects(tag, bounds)) {
            // Collide with bound to form a cloud
            var sprite = tag.sprite,
                w = tag.width >> 5,
                sw = size[0] >> 5,
                lx = tag.x - (w << 4),
                sx = lx & 0x7f,
                msx = 32 - sx,
                h = tag.y1 - tag.y0,
                x = (tag.y + tag.y0) * sw + (lx >> 5),
                last;
            for (var j = 0; j < h; j++) {
              last = 0;
              for (var i = 0; i <= w; i++) {
                board[x + i] |= (last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0);
              }
              x += sw;
            }
            delete tag.sprite;
            addTag(tag);
            event.placed(tags, bounds, tag);
            return true;
//          }
        }
      }
      event.failed(tag);
      return false;
    }

    cloud.size = function(x) {
      if (!arguments.length) return size;
      size = [+x[0], +x[1]];
      return cloud;
    };

    cloud.words = function(x) {
      if (!arguments.length) return words;
      words = x;
      return cloud;
    };

    cloud.images = function (x) {
      if (!arguments.length) return images;
      images = x;
      return cloud;
    };

    // TODO: meta programming to reduce code copy
    cloud.imageHref = function (x) {
      if (!arguments.length) return imageHref;
      imageHref = d3.functor(x);
      return cloud;
    };

    cloud.imageWidth = function (x) {
      if (!arguments.length) return imageWidth;
      imageWidth = d3.functor(x);
      return cloud;
    };

    cloud.imageHeight = function (x) {
      if (!arguments.length) return imageHeight;
      imageHeight = d3.functor(x);
      return cloud;
    };

    cloud.font = function(x) {
      if (!arguments.length) return font;
      font = d3.functor(x);
      return cloud;
    };

    cloud.fontStyle = function(x) {
      if (!arguments.length) return fontStyle;
      fontStyle = d3.functor(x);
      return cloud;
    };

    cloud.fontWeight = function(x) {
      if (!arguments.length) return fontWeight;
      fontWeight = d3.functor(x);
      return cloud;
    };

    cloud.rotate = function(x) {
      if (!arguments.length) return rotate;
      rotate = d3.functor(x);
      return cloud;
    };

    cloud.text = function(x) {
      if (!arguments.length) return text;
      text = d3.functor(x);
      return cloud;
    };

    cloud.spiral = function(x) {
      if (!arguments.length) return spiral;
      spiral = spirals[x + ""] || x;
      return cloud;
    };

    cloud.startPos = function (x) {
      if (!arguments.length) return startPos;
      startPos = startPosOpts[x + ""] || x;
      return cloud;
    };

    cloud.fontSize = function(x) {
      if (!arguments.length) return fontSize;
      fontSize = d3.functor(x);
      return cloud;
    };

    cloud.padding = function(x) {
      if (!arguments.length) return padding;
      padding = d3.functor(x);
      return cloud;
    };

    return d3.rebind(cloud, event, "on");
  }

  // default fn for attribute access
  function cloudImageHref(d) {
    d.href = d.href || "images/" + d.image;
    return d.href;
  }

  function cloudImageWidth(d) {
    d.imgWidth = d.imgWidth || 64;
    return d.imgWidth;
  }

  function cloudImageHeight(d) {
    d.imgHeight = d.imgHeight || 32;
    return d.imgHeight;
  }

  function cloudText(d) {
    return d.text;
  }

  function cloudFont() {
    return "serif";
  }

  function cloudFontNormal() {
    return "normal";
  }

  function cloudFontSize(d) {
    return Math.sqrt(d.value);
  }

  function cloudRotate(d) {
    return d.rotate !== undefined ? d.rotate : (~~(Math.random() * 6) - 3) * 30;
  }

  function cloudPadding() {
    return 1;
  }

  // stage 1, draw tag on canvas
  //
  // @param d data to draw
  // @param c canvas context
  // @param s context might have dirty stat in looping
  function cloudSpriteStage1(d, c, s) {
    var w, h;
    var stat = s || {
      x: 0,
      y: 0,
      maxh: 0
    };

    c.save();

    // TODO: replace with function
    if ("text" in d) {
      c.font = d.style + " " + d.weight + " " + ~~((d.size + 1) / ratio) + "px " + d.font;
      w = c.measureText(d.text + "m").width * ratio;
      h = (d.size * ratio) << 1;
    } else if ("img" in d) {
      w = d.imgWidth * ratio;
      h = d.imgHeight * ratio;
    } else {
      throw new Error("unsupported data", d);
    }

    if (d.rotate) {
      var sr = Math.sin(d.rotate * cloudRadians),
          cr = Math.cos(d.rotate * cloudRadians),
          wcr = w * cr,
          wsr = w * sr,
          hcr = h * cr,
          hsr = h * sr;
      w = (Math.max(Math.abs(wcr + hsr), Math.abs(wcr - hsr)) + 0x1f) >> 5 << 5;
      h = ~~Math.max(Math.abs(wsr + hcr), Math.abs(wsr - hcr));
    } else {
      w = (w + 0x1f) >> 5 << 5;
    }
    if (h > stat.maxh) stat.maxh = h;
    if (stat.x + w >= (cw << 5)) {
      stat.x = 0;
      stat.y += stat.maxh;
      stat.maxh = 0;
    }
    if (stat.y + h >= ch) return false;
    c.translate((stat.x + (w >> 1)) / ratio, (stat.y + (h >> 1)) / ratio);
    if (d.rotate) c.rotate(d.rotate * cloudRadians);
    // TODO: replace with function
    if ("text" in d) {
      c.fillText(d.text, 0, 0);
      if (d.padding) {
        c.lineWidth = 2 * d.padding;
        c.strokeText(d.text, 0, 0);
      }
    } else if ("img" in d) {
      // TODO: handle padding
      // simulate textAlign: center, textBaseline: alphabetic
      c.drawImage(d.img, -d.imgWidth * ratio / 2, -d.imgHeight * ratio / 2, d.imgWidth * ratio, d.imgHeight * ratio);
    } else {
      throw new Error("unsupported data", d);
    }

    c.restore();

    d.width = w;
    d.height = h;
    d.xoff = stat.x;
    d.yoff = stat.y;
    // offset to center
    d.x1 = w >> 1; // right offset
    d.y1 = h >> 1; // bottom offset
    d.x0 = -d.x1; // left offset
    d.y0 = -d.y1; // top offset
    d.hasText = true;
    stat.x += w;
    return true;
  }

  // sprite stage 2, generate sprite from pixels
  //
  // @param d data
  // @param c canvas context
  // @param pixels canvas image data
  function cloudSpriteStage2(d, pixels) {
    if (!d.hasText) return false;
    var w = d.width,
        w32 = w >> 5,
        h = d.y1 - d.y0,
        x,y,
        sprite = [];
    // Zero the buffer
    for (var i = 0; i < h * w32; i++) sprite[i] = 0;
    x = d.xoff;
    if (x === null) return false;
    y = d.yoff;
    var seen = 0,
        seenRow = -1;
    for (var j = 0; j < h; j++) {
      for (i = 0; i < w; i++) {
        var k = w32 * j + (i >> 5),
            m = pixels[((y + j) * (cw << 5) + (x + i)) << 2] ? 1 << (31 - (i % 32)) : 0;
        sprite[k] |= m;
        seen |= m;
      }
      if (seen) seenRow = j;
      else {
        d.y0++;
        h--;
        j--;
        y++;
      }
    }
    d.y1 = d.y0 + seenRow;
    d.sprite = sprite.slice(0, (d.y1 - d.y0) * w32);
    return true;
  }

  // Fetches a monochrome sprite bitmap for the specified text.
  // Load in batches for speed.
  function cloudSprite(d, c, data, di) {
    if (d.sprite) return;
    c = c || cloudCanvas().getContext("2d");
    data = data || [d];
    di = di === undefined ? 0 : di;

    c.clearRect(0, 0, (cw << 5) / ratio, ch / ratio);
    var stat = {
        x: 0,
        y: 0,
        maxh: 0
    };
    --di;
    while (++di < data.length) {
      d = data[di];
      if (!cloudSpriteStage1(d, c, stat)) {
        break;
      }
    }

    // Getting image data is expensive so we split sprite into two stages and do this only once
    var pixels = c.getImageData(0, 0, (cw << 5) / ratio, ch / ratio).data;

    while (--di >= 0) {
      d = data[di];
      cloudSpriteStage2(d, pixels);
    }
  }

  // Use mask-based collision detection.
  function cloudCollide(tag, board, sw) {
    sw = sw >> 5;
    var sprite = tag.sprite,
        w = tag.width >> 5,
        lx = tag.x - (w << 4),
        sx = lx & 0x7f,
        msx = 32 - sx,
        h = tag.y1 - tag.y0,
        x = (tag.y + tag.y0) * sw + (lx >> 5),
        last;
    for (var j = 0; j < h; j++) {
      last = 0;
      for (var i = 0; i <= w; i++) {
        if (((last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0))
            & board[x + i]) return true;
      }
      x += sw;
    }
    return false;
  }

  // Extend cloud bounds with new data
  function cloudBounds(bounds, d) {
    var b0 = bounds[0],
        b1 = bounds[1];
    if (d.x + d.x0 < b0.x) b0.x = d.x + d.x0;
    if (d.y + d.y0 < b0.y) b0.y = d.y + d.y0;
    if (d.x + d.x1 > b1.x) b1.x = d.x + d.x1;
    if (d.y + d.y1 > b1.y) b1.y = d.y + d.y1;
  }

  function collideRects(a, b) {
    return a.x + a.x1 > b[0].x && a.x + a.x0 < b[1].x && a.y + a.y1 > b[0].y && a.y + a.y0 < b[1].y;
  }

  function archimedeanSpiral(size) {
    var e = size[0] / size[1];
    return function(t) {
      return [e * (t *= 0.1) * Math.cos(t), t * Math.sin(t)];
    };
  }

  function rectangularSpiral(size) {
    var dy = 4,
        dx = dy * size[0] / size[1],
        x = 0,
        y = 0;
    return function(t) {
      var sign = t < 0 ? -1 : 1;
      // See triangular numbers: T_n = n * (n + 1) / 2.
      switch ((Math.sqrt(1 + 4 * sign * t) - sign) & 3) {
        case 0:  x += dx; break;
        case 1:  y += dy; break;
        case 2:  x -= dx; break;
        default: y -= dy; break;
      }
      return [x, y];
    };
  }

  // init symbols position at specified point so it will result in compact layout
  function centerPointPos(d, size) {
    if (d.x === undefined) { d.x = size[0] >> 1;}
    if (d.y === undefined) { d.y = size[1] >> 1;}
  }

  // init symbols position in a rectangle so it will result in loose layout
  function centerAreaPos(d, size) {
    if (d.x === undefined) { d.x = (size[0] * (Math.random() + 0.5)) >> 1;}
    if (d.y === undefined) { d.y = (size[1] * (Math.random() + 0.5)) >> 1;}
  }

  // TODO reuse arrays?
  function zeroArray(n) {
    var a = [],
        i = -1;
    while (++i < n) a[i] = 0;
    return a;
  }

  var cloudRadians = Math.PI / 180,
      cw = 1 << 11 >> 5,
      ch = 1 << 11,
      ratio = 1;

  function cloudCanvas() {
    var canvas;
    if (typeof document !== "undefined") {
      canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      ratio = Math.sqrt(canvas.getContext("2d").getImageData(0, 0, 1, 1).data.length >> 2);
      canvas.width = (cw << 5) / ratio;
      canvas.height = ch / ratio;
      // show canvas for debugging
      // document.body.appendChild(canvas);
    } else {
      // node-canvas support
      var Canvas = require("canvas");
      canvas = new Canvas(cw << 5, ch);
    }
    return canvas;
  }

  var cloudContext = cloudCanvas().getContext("2d"),
      spirals = {
        archimedean: archimedeanSpiral,
        rectangular: rectangularSpiral
      },
      startPosOpts = {
        point: centerPointPos,
        area: centerAreaPos
      };

  cloudContext.fillStyle = cloudContext.strokeStyle = "red";
  cloudContext.textAlign = "center";
  cloudContext.textBaseline = "middle";

  exports.cloud = makeCloud;
})(typeof exports === "undefined" ? d3.layout || (d3.layout = {}) : exports);
