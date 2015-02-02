GB = {
    reset: function() {
        Z80.reset();
        MMU.reset();
        GPU.reset();
        MMU.load();
    },

    frame: function() {
        var fclk = Z80.clk.m + 17556;
        do {
            Z80.execop();
            Z80.reg.pc &= 65535;
            Z80.clk.m += Z80.reg.m;
            if (Z80.clk.m >= fclk) console.log(Z80.clk.m, fclk);
            GPU.step();
        } while (Z80.clk.m < fclk);
    },

    interval: null,

    run: function() {
        if (!GB.interval) {
            GB.interval = setInterval(GB.frame, 1);
            document.getElementById('run').innerHTML = 'Pause';
        } else {
            clearInterval(GB.interval);
            GB.interval = null;
            document.getElementById('run').innerHTML = 'Run';
        }
    }
};

window.onload = function()
{
    document.getElementById('reset').onclick = GB.reset;
    document.getElementById('run').onclick = GB.run;
    GB.reset();
};