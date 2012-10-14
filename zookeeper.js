// -*- coding: utf-8 -*-

ZooKeeper = window.ZooKeeper || {};

(function($, console) {

    // generated with pattern.py
    var patterns = [[[0, 1], [0, -2]], [[2, 0], [-1, 0]], [[1, 0], [-2, 0]], [[0, -1], [0, 2]], [[1, -1], [1, 1]], [[-1, 1], [-1, -1]], [[1, -1], [-1, -1]], [[-1, 1], [1, 1]], [[-1, 1], [-1, 2]], [[1, -1], [1, -2]], [[2, -1], [1, -1]], [[-1, -1], [-2, -1]], [[-1, -1], [-1, -2]], [[-2, 1], [-1, 1]], [[1, 1], [2, 1]], [[1, 2], [1, 1]], [[1, 0], [2, 1]], [[0, 1], [-1, 2]], [[1, 2], [0, 1]], [[1, 0], [2, -1]], [[-2, 1], [-1, 0]], [[-1, 0], [-2, -1]], [[0, -1], [1, -2]], [[0, -1], [-1, -2]]];
    var numPatterns = patterns.length;

    var ready;
    var numKinds = 7;
    var mw = 8;
    var mh = 8;
    var imgw = 40;
    var imgh = 40;
    var ofs = 8;
    var offsetTop;
    var bh = 334; // 盤面の縦ピクセル数
    var ctx;

    var mod = function(m, n) {
        return m - n * Math.floor(m / n);
    }

    var walk = function(f) {
        for (var n = 0, len = mw * mh; n < len; ++n) {
            if (f(n % mw, (n / mw)|0)) {
                return true;
            }
        }
        return false;
    }

    var walkx = function(f) {
        for (var x = 0; x < mw; ++x) {
            if (f(x)) {
                return true;
            }
        }
        return false;
    }

    var names = [
        'bg.png',
        'elephant.png',
        'frog.png',
        'giraffe.png',
        'hipo.png',
        'lion.png',
        'monkey.png',
        'panda.png'];

    var imgs = Array(names.length);

    var createImage = function(url) {
        var e = new Image();
        e.onload = function() { e.setAttribute('data-loaded', '1'); }
        e.src = url + '?' + new Date().getTime();
        return e;
    }

    document.addEventListener('DOMContentLoaded', function() {
        for (var n = 0, len = names.length; n < len; ++n) {
            imgs[n] = createImage('img/' + names[n]);
        }
    }, false);








    var draw = function(n, x, y) {
        if (0 < n) {
            ctx.drawImage(imgs[n], x, y + ofs);
        }
    }

    var Status = {
        NORMAL: 1,
        MOVING: 2,
        FIXING: 3,
        DISAPPEARING: 4,
        FALLING: 5
    }

    var actions = {};

    actions[Status.NORMAL] = function() {};
    actions[Status.NORMAL].prototype = {
        status: Status.NORMAL,
        work: function(p) {},
        draw: function(p, x, y) {
            draw(p.n, x * imgw, y * imgh);
        }
    }

    actions[Status.MOVING] = function(dx, dy) {
        this.dx = dx;
        this.dy = dy;
        this.ex = this.ey = this.fx = this.fy = 0;
    }
    actions[Status.MOVING].prototype = {
        status: Status.MOVING,
        work: function() {
            this.ex = (((Math.random() * 2)|0) - 1) * 1;
            this.ey = (((Math.random() * 2)|0) - 1) * 1;
        },
        moveTo: function(fx, fy) {
            this.fx = fx - this.dx;
            this.fy = fy - this.dy;
        },
        draw: function(p, x, y) {}, // 順序通りに描画してしまうと移動中の駒が背後に隠れてしまう場合があるのでここでは描画しない
        drawOnTop: function(p, x, y) {
            draw(p.n, x * imgw + this.ex + this.fx, y * imgh + this.ey + this.fy);
        }
    }

    actions[Status.FIXING] = function(cx, cy, x, y) {
        this.px = x * imgw;
        this.py = y * imgw;
        this.w = cx - this.px;
        this.h = cy - this.py;
        this.duration = this.count = 4;
        this.dx = this.dy = 0;
    }
    actions[Status.FIXING].prototype = {
        status: Status.FIXING,
        work: function(p) {
            this.dx = this.w * this.count / this.duration;
            this.dy = this.h * this.count / this.duration;
            if (0 === --this.count) {
                p.action = actions.normalAction;
                return true;
            }
        },
        draw: function(p, x, y) {
            draw(p.n, this.px + this.dx, this.py + this.dy);
        }
    }

    actions[Status.DISAPPEARING] = function() {
        this.count = 12;
    }
    actions[Status.DISAPPEARING].prototype = {
        status: Status.DISAPPEARING,
        work: function(p) {
            if (0 < this.count) {
                --this.count;
            }
            else {
                return true;
            }
        },
        draw: function(p, x, y) {
            if ((this.count >> 2) & 1) {
                draw(p.n, x * imgw, y * imgh);
            }
        }
    }

    actions[Status.FALLING] = function() {
        this.duration = this.count = 4;
    }
    actions[Status.FALLING].prototype = {
        work: function(p) {
            if (0 === --this.count) {
                p.action = actions.normalAction;
                return true;
            }
        },
        draw: function(p, x, y) {
            draw(p.n, x * imgw, y * imgh - imgh * this.count / this.duration);
        }
    }

    actions.normalAction = new actions[Status.NORMAL]();








    var Piece = function(n) {
        this.n = n;
        this.action = actions.normalAction;
    }
    Piece.prototype = {
        move: function(dx, dy) {
            if (0 < this.n && this.action.status === Status.NORMAL) {
                this.action = new actions[Status.MOVING](dx, dy);
                return this;
            }
        },
        moveTo: function(px, py) {
            if (this.action.moveTo) {
                this.action.moveTo(px, py);
            }
        },
        fix: function(cx, cy, x, y) {
            this.action = new actions[Status.FIXING](cx, cy, x, y);
        },
        disappear: function() {
            this.action = new actions[Status.DISAPPEARING]();
        },
        fall: function() {
            this.action = new actions[Status.FALLING]();
        },
        work: function() {
            return this.action.work(this);
        },
        draw: function(x, y) {
            this.action.draw(this, x, y);
        }
    }
    Piece.empty = new Piece(0);
    Piece.sentinel = new Piece(-1);









    var Board = function() {

        var ps = Array(mw * mh);

        var get = function(x, y) {
            if (0 <= x && x < mw && 0 <= y && y < mh) {
                return ps[y * mw + x];
            }
            else {
                return Piece.sentinel;
            }
        }
        this.get = get;

        var set = function(x, y, n) {
            if (0 <= x && x < mw && 0 <= y && y < mh) {
                if (typeof n === 'undefined') {
                    n = new Piece(1 + (Math.random() * numKinds)|0);
                }
                ps[y * mw + x] = n;
            }
        }
        this.set = set;

        this.clear = function() {
            walk(function(x, y) { set(x, y, Piece.empty); });
        }

        this.reset = function() {
            walk(set);
            while (walk(function(x, y) {
                var p = get(x, y).n;
                if (
                    0 < p &&
                    ((p == get(x + 1, y).n && p == get(x + 2, y).n) ||
                     (p == get(x, y + 1).n && p == get(x, y + 2).n)))
                {
                    while (p == get(x, y).n) {
                        set(x, y);
                    }
                    return true;
                }
            }));
        }

        this.draw = function() {
            walk(function(x, y) {
                get(x, y).draw(x, y);
            });
        }
    }








    var Event = function(controller) {

        var spos;

        var incell = function(px, py) {
            // TODO 微妙 (角度とか)
            var x = Math.floor(px / imgw);
            var y = Math.floor((py - ofs) / imgh);
            if (0 <= x && x < mw && 0 <= y && y < mh) {
                return [x, y];
            }
        }

        var handleTouchEvent = function(e, f) {
            e.preventDefault();
            if (e.changedTouches && e.changedTouches[0]) {
                e = e.changedTouches[0];
            }
            if (typeof e.pageX === 'undefined') {
                return;
            }
            var px = e.pageX;
            var py = e.pageY - offsetTop;
            f(e, px, py);
        }

        this.onTouchStart = function(e) {
            handleTouchEvent(e, function(e, px, py) {
                console.log('s: (' + px + ', ' + py + ')');
                spos = incell(px, py);
                if (spos) {
                    controller.pieceMoveStart(spos[0], spos[1], px, py);
                }
            });
        }

        this.onTouchMove = function(e) {
            if (spos) {
                handleTouchEvent(e, function(e, px, py) {
                    controller.pieceMove(px, py);
                });
            }
        }

        this.onTouchEnd = function(e) {
            if (spos) {
                handleTouchEvent(e, function(e, px, py) {
                    console.log('e: (' + px + ', ' + py + ')');
                    var epos = incell(e.pageX, e.pageY - offsetTop);
                    controller.pieceMoveEnd(spos, epos, px, py);
                });
            }
        }
    }









    $.Controller = new function() {

        var self = this;
        var event = new Event(this);
        var board = new Board();
        var moving, mx, my;
        var hinting = 0;

        var getHint = function() {
            var hs = Array(mh * mw);
            walk(function(x, y) {
                for (var a = 0; a < numPatterns; ++a) {
                    var p = board.get(x, y);
                    var n = p.n;
                    if (n <= 0 || p.action.status !== Status.NORMAL) {
                        continue;
                    }
                    var cx = patterns[a];
                    var p1 = board.get(x + cx[0][0], y + cx[0][1]);
                    var p2 = board.get(x + cx[1][0], y + cx[1][1]);
                    if (
                        n == p1.n && p1.action.status === Status.NORMAL &&
                        n == p2.n && p2.action.status === Status.NORMAL)
                    {
                        hs[y * mh + x] = n;
                        hs[(y + cx[0][1]) * mh + x + cx[0][0]] = n;
                        hs[(y + cx[1][1]) * mh + x + cx[1][0]] = n;
                    }
                }
            });
            return hs;
        }

        this.hint = function() {
            if (ready  && running) {
                hinting = 32;
            }
        }

        var makeHashKey = function(x, y) {
            return '' + x + ',' + y;
        }

        // 同一の駒が 3 個以上揃っている箇所の座標群を返す.
        // 揃っていない場合は空の配列を返す.
        //
        var matches = function() {
            var ts = {};
            walk(function(x, y) {
                var p = board.get(x, y);
                if (p.n <= 0 || p.action.status !== Status.NORMAL) {
                    return;
                }

                [[[1, 0], [2, 0]], [[0, 1], [0, 2]]].forEach(function(v) {
                    var vx1 = v[0][0];
                    var vy1 = v[0][1];
                    var vx2 = v[1][0];
                    var vy2 = v[1][1];
                    var p1 = board.get(x + vx1, y + vy1);
                    var p2 = board.get(x + vx2, y + vy2);
                    if (
                        p.n == p1.n && p1.action.status === Status.NORMAL &&
                        p.n == p2.n && p2.action.status === Status.NORMAL)
                    {
                        ts[makeHashKey(x +   0,   y + 0)] = [x +   0, y +   0];
                        ts[makeHashKey(x + vx1, y + vy1)] = [x + vx1, y + vy1];
                        ts[makeHashKey(x + vx2, y + vy2)] = [x + vx2, y + vy2];
                    }
                });
            });

            var us = [];
            for (var key in ts) {
                console.log(ts[key]);
                us.push(ts[key]);
            }
            console.log('matches: ' + us.length);
            return us;
        }

        var doMatch = function() {

            var ts = matches();
            var len = ts.length;
            if (len == 0) {
                return false;
            }

            for (var n = 0; n < len; ++n) {
                board.get(ts[n][0], ts[n][1]).disappear();
            }
            return true;
        }

        this.pieceMoveStart = function(x, y, dx, dy) {
            if (!moving) {
                moving = board.get(x, y).move(dx, dy);
                mx = x;
                my = y;
            }
        }

        this.pieceMove = function(px, py) {
            if (moving) {
                moving.moveTo(px, py);
            }
        }

        this.pieceMoveEnd = function(spos, epos, px, py) {
            if (moving) {
                var cx = mx * imgw + moving.action.fx;
                var cy = my * imgh + moving.action.fy;

                if (
                    spos && epos &&
                    ((spos[0] == epos[0] && spos[1] != epos[1]) ||
                     (spos[1] == epos[1] && spos[0] != epos[0])))
                {
                    var dx = epos[0] - spos[0];
                    var dy = epos[1] - spos[1];
                    if (dx) dx /= Math.abs(dx);
                    if (dy) dy /= Math.abs(dy);

                    var x1 = spos[0];
                    var y1 = spos[1];
                    var x2 = spos[0] + dx;
                    var y2 = spos[1] + dy;

                    var p1 = board.get(x1, y1);
                    var p2 = board.get(x2, y2);
                    board.set(x1, y1, new Piece(p2.n));
                    board.set(x2, y2, new Piece(p1.n));
                    var ts = matches();

                    if (0 === ts.length) {
                        board.set(x1, y1, p1);
                        board.set(x2, y2, p2);
                    }
                    else {
                        board.set(x1, y1, p2);
                        board.set(x2, y2, p1);

                        console.log('slided (' + x1 + ', ' + y1 + ') - (' + dx + ', ' + dy + ')');
                        p1.fix(cx, cy, x2, y2);
                        p2.fix(x2 * imgw, y2 * imgh, x1, y1);
                        moving = void 0;
                        return;
                    }
                }

                // 駒を移動しても何も揃わないような場合は元の位置に戻す (移動させない)
                moving.fix(cx, cy, mx, my);
                moving = void 0;
            }
        }

        var work = function() {

            if (0 < hinting) {
                --hinting;
            }

            happened = false;
            walk(function(x, y) {
                y = mh - y - 1;
                var p = board.get(x, y);
                if (p.work()) {
                    happened = true;
                    if (p.action.status === Status.DISAPPEARING) {
                        board.set(x, y, Piece.empty);
                    }
                    console.log('(' + x + ', ' + y + '): ' + p.n + ', ' + p.action.status);
                }
                if (p.action.status === Status.NORMAL) {
                    if (board.get(x, y + 1).n === 0) {
                        board.set(x, y + 1, p);
                        board.set(x, y, Piece.empty);
                        p.fall();
                    }
                }
            });

            walkx(function(x) {
                var p = board.get(x, 0);
                if (!p.n) {
                    board.set(x, 0);
                    board.get(x, 0).fall();
                }
            });

            if (happened) {
                doMatch();

                if (!walk(function(x, y) {
                    var p = board.get(x, y);
                    if (!p.n || p.action.status !== Status.NORMAL) {
                        return true;
                    }
                })) {
                    var hs = getHint();
                    var reaches = 0;
                    for (var n = 0, len = hs.length; n < len; ++n) {
                        if (hs[n]) {
                            ++reaches;
                        }
                    }
                    if (!reaches) {
                        nomoremoves = true;
                        running = false;
                    }
                }
            }
        }

        var update = function() {
            ctx.drawImage(imgs[0], 0, 0);
            board.draw();
            if (moving) {
                moving.action.drawOnTop(moving, mx, my);
            }
            if ((hinting >> 3) & 1) {
                ctx.strokeStyle = '#F33';
                ctx.lineWidth = 3;
                var hs = getHint();
                for (var n = 0, len = hs.length; n < len; ++n) {
                    var y = (n / mw)|0;
                    var x = n % mw;
                    if (hs[y * mw + x]) {
                        ctx.strokeRect(x * imgw + 3, y * imgh + 3 + ofs, imgw - 6, imgh - 6);
                    }
                }
            }
            if (nomoremoves) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, 0, 320, bh);
                ctx.font = '32px monospace';
                ctx.strokeStyle = '#333';
                ctx.fillStyle = '#CFF';
                ctx.strokeText('No more moves!!', 20, 150);
                ctx.fillText('No more moves!!', 20, 150);
            }
        }

        var divFps;
        var lastTs;
        var lastTsToDisplayUnit;
        var showFps = function() {
            if (!divFps) {
                return;
            }

            var ts = +new Date();
            if (lastTs) {
                var fps = '' + Math.floor(10000.0 / (ts - lastTs));
                fps = fps.substring(0, fps.length - 1) + '.' + fps.substring(fps.length - 1);
                var tsToDisplayUnit = Math.floor(ts / 200.0);
                if (lastTsToDisplayUnit != tsToDisplayUnit) {
                    divFps.textContent = fps;
                    lastTsToDisplayUnit = tsToDisplayUnit;
                }
            }
            lastTs = ts;
        }

        var running;
        var nomoremoves;
        var onEnterFrame = function() {
            showFps();
            work();
            update();
            if (running) {
                setTimeout(onEnterFrame, 50);
            }
        }

        this.reset = function() {
            if (ready) {
                nomoremoves = false;
                board.reset();
/*
                var b = [
                    3, 2, 3, 4, 5, 6, 7, 1,
                    2, 3, 2, 2, 6, 7, 1, 2,
                    3, 4, 3, 6, 7, 1, 2, 3,
                    4, 5, 6, 7, 1, 2, 3, 4,
                    5, 6, 7, 1, 2, 3, 4, 5,
                    6, 7, 1, 2, 3, 4, 5, 6,
                    7, 1, 2, 3, 4, 5, 6, 7,
                    1, 2, 3, 4, 5, 6, 7, 1];

                walk(function(x, y) {
                    board.set(x, y, new Piece(b[y * mw + x]));
                });
*/
                this.start();
            }
        }

        this.start = function() {
            if (ready && !running) {
                running = true;
                onEnterFrame();
            }
        }

        this.stop = function() {
            if (ready) {
                running = false;
            }
        }

        this.ready = function(f) {
            for (var n = 0, len = names.length; n < len; ++n) {
                if (!imgs[n] || !imgs[n].getAttribute('data-loaded')) {
                    setTimeout(arguments.callee, 200, f);
                    return;
                }
            }
            if (document.getElementById('fps')) {
                divFps = document.getElementById('fps');
            }
            var canvas = document.getElementById('canvas');
            ctx = canvas.getContext && canvas.getContext('2d');
            canvas.width = 320;
            canvas.height = bh;

            canvas.addEventListener('touchstart', function(e) { event.onTouchStart(e); }, false);
            canvas.addEventListener('touchmove',  function(e) { event.onTouchMove(e); },  false);
            canvas.addEventListener('touchend',   function(e) { event.onTouchEnd(e); },   false);
            canvas.addEventListener('mousedown',  function(e) { event.onTouchStart(e); }, false);
            canvas.addEventListener('mousemove',  function(e) { event.onTouchMove(e); },  false);
            canvas.addEventListener('mouseup',    function(e) { event.onTouchEnd(e); },   false);
            offsetTop = canvas.offsetTop;

            ready = true;
            self.reset(); //board.clear();
            update();
            if (f) {
                f(self);
            }
        }
    }

})(ZooKeeper,
   //console
   {log: function(x){}}
);
