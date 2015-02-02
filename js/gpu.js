GPU = {
    canvas: {},
    scrn: {},
    mode: 0,
    modeclk: 0,
    line: 0,
    tileset: [],
    vram: [],
    oam: [],
    scx: 0,
    scy: 0,
    bgmap: 1,
    bgtile: 0,
    switchbg: 0,
    switchlcd: 0,
    pal: [[255, 255, 255, 255],
          [192, 192, 192, 255],
          [96, 96, 96, 255],
          [0, 0, 0, 255]],

    step: function() {
        GPU.modeclk += Z80.reg.m;

        switch (GPU.mode) {
            // OAM read mode
            case 2:
                if (GPU.modeclk >= 20) {
                    GPU.modeclk = 0;
                    GPU.mode = 3;
                }
                break;
            // VRAM read mode
            case 3:
                if (GPU.modeclk >= 43) {
                    GPU.modeclk = 0;
                    GPU.mode = 0;
                    GPU.renderscan();
                }
                break;
            // H-Blank
            case 0:
                if (GPU.modeclk >= 51) {
                    GPU.modeclk = 0;
                    GPU.line++;
                    if (GPU.line == 143) {
                        GPU.mode = 1;
                        GPU.canvas.putImageData(GPU.scrn, 0, 0);
                    } else {
                        GPU.mode = 2;
                    }
                }
                break;
            // V-Blank
            case 1:
                if (GPU.modeclk >= 114) {
                    GPU.modeclk = 0;
                    GPU.line++;
                    if (GPU.line > 153) {
                        GPU.line = 0;
                        GPU.mode = 2;
                    }
                }
                break;
        }
    },

    reset: function() {
        for(var i=0; i<8192; i++) {
            GPU.vram[i] = 0;
        }
        for(i=0; i<160; i++) {
            GPU.oam[i] = 0;
        }
        var c = document.getElementById('screen');
        if(c && c.getContext)
        {
            GPU.canvas = c.getContext('2d');
            if(GPU.canvas)
            {
                if(GPU.canvas.createImageData)
                    GPU.scrn = GPU.canvas.createImageData(160, 144);

                else if(GPU.canvas.getImageData)
                    GPU.scrn = GPU.canvas.getImageData(0,0, 160,144);

                else
                    GPU.scrn = {
                        'width': 160,
                        'height': 144,
                        'data': new Array(160*144*4)
                    };

                // Initialise canvas to white
                for(i=0; i<160*144*4; i++)
                    GPU.scrn.data[i] = 255;

                GPU.canvas.putImageData(GPU.scrn, 0, 0);
            }
        }
        GPU.tileset = [];
        for(i = 0; i < 512; i++) {
            GPU.tileset[i] = [];
            for(var j = 0; j < 8; j++) {
                GPU.tileset[i][j] = [0,0,0,0,0,0,0,0];
            }
        }
        GPU.bgmap = 1;
        GPU.bgtile = 0;
    },

    updatetile: function(addr, val) {
        addr &= 0x1FFE;
        var tile = (addr >> 4) & 511;
        var y = (addr >> 1) & 7;
        var sx;
        for (var x = 0; x < 8; x++) {
            sx = 1 << (7-x);
            GPU.tileset[tile][y][x] =
                ((GPU.vram[addr] & sx)   ? 1 : 0) +
                ((GPU.vram[addr+1] & sx) ? 2 : 0);
        }
    },

    renderscan: function() {
        var mapoffs = GPU.bgmap ? 0x1C00 : 0x1800;
        mapoffs += ((GPU.line + GPU.scy) & 255) >> 3;
        var lineoffs = (GPU.scx >> 3);
        var y = (GPU.line + GPU.scy) & 7;
        var x = GPU.scx & 7;
        var canvasoffs = GPU.line * 160 * 4;
        var color;
        var tile = GPU.vram[mapoffs + lineoffs];
        if(GPU.bgtile == 1 && tile < 128) tile += 256;
        for(var i = 0; i < 160; i++)
        {
            // Re-map the tile pixel through the palette
            color = GPU.pal[GPU.tileset[tile][y][x]];

            // Plot the pixel to canvas
            GPU.scrn.data[canvasoffs+0] = color[0];
            GPU.scrn.data[canvasoffs+1] = color[1];
            GPU.scrn.data[canvasoffs+2] = color[2];
            GPU.scrn.data[canvasoffs+3] = color[3];
            canvasoffs += 4;

            // When this tile ends, read another
            x++;
            if(x == 8)
            {
                x = 0;
                lineoffs = (lineoffs + 1) & 31;
                console.log(GPU.vram);
                tile = GPU.vram[mapoffs + lineoffs];
                if(GPU.bgtile == 1 && tile < 128) tile += 256;
            }
        }
    },

    rb: function(addr) {
        addr -= 0xFF40;
        switch (addr) {
            case 0:
                return (GPU.switchbg  ? 0x01 : 0x00) |
                    (GPU.bgmap     ? 0x08 : 0x00) |
                    (GPU.bgtile    ? 0x10 : 0x00) |
                    (GPU.switchlcd ? 0x80 : 0x00);
            case 2:
                return GPU.scy;

            case 3:
                return GPU.scx;

            case 4:
                return GPU.line;
        }
    },

    wb: function(addr, val) {
        addr -= 0xFF40;
        switch (addr) {
            case 0:
                GPU.switchbg  = (val & 0x01) ? 1 : 0;
                GPU.bgmap     = (val & 0x08) ? 1 : 0;
                GPU.bgtile    = (val & 0x10) ? 1 : 0;
                GPU.switchlcd = (val & 0x80) ? 1 : 0;
                break;

            case 2:
                GPU.scy = val;
                break;

            case 3:
                GPU.scx = val;
                break;

            case 7:
                for(var i = 0; i < 4; i++)
                {
                    switch((val >> (i * 2)) & 3)
                    {
                        case 0: GPU.pal[i] = [255,255,255,255]; break;
                        case 1: GPU.pal[i] = [192,192,192,255]; break;
                        case 2: GPU.pal[i] = [ 96, 96, 96,255]; break;
                        case 3: GPU.pal[i] = [  0,  0,  0,255]; break;
                    }
                }
                break;
        }
    }
};
function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}