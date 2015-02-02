Z80 = {
    clk: {m: 0, t: 0},
    reg: {
        a: 0, b: 0, c: 0, d: 0, e: 0, h: 0, l: 0, f: 0,
        pc: 0, sp: 0,
        m: 0, t: 0
    },
    ime: 1,
    halt: 0,
    stop: 0,
    reset: function() {
        Z80.clk = {m: 0, t: 0};
        Z80.reg = {
            a: 0, b: 0, c: 0, d: 0, e: 0, h: 0, l: 0, f: 0,
            pc: 0, sp: 0,
            m: 0, t: 0
        };
        Z80.ime = 1;
        Z80.halt = 0;
        Z80.stop = 0;
    },
    ops: {
        NOP: function() {
            Z80.reg.m = 1; 
        },
        // 8-bit loads
        // LD r,n: load 8-bit value n into register r.
        LDrn: function(reg) {
            Z80.reg[reg] = MMU.rb(Z80.reg.pc++);
            Z80.reg.m = 2; 
        },
        // LD r1,r2: copy register r2 ito register r1.
        LDrr: function(r1, r2) {
            Z80.reg[r1] = Z80.reg[r2];
            Z80.reg.m = 1; 
        },
        // LD r,(HL): load byte at address (HL) into register r.
        LDrHL: function(reg) {
            Z80.reg[reg] = MMU.rb((Z80.reg.h << 8) + Z80.reg.l);
            Z80.reg.m = 2; 
        },
        // LD (HL),r: load register r into byte at address (HL).
        LDHLr: function(reg) {
            MMU.wb((Z80.reg.h << 8) + Z80.reg.l, Z80.reg[reg]);
            Z80.reg.m = 2; 
        },
        // LD (HL),n: load 8-bit value n into byte at address (HL).
        LDHLn: function() {
            MMU.wb((Z80.reg.h << 8) + Z80.reg.l, MMU.rb(Z80.reg.pc++));
            Z80.reg.m = 3; 
        },
        // LD A,rr: load address denoted by two registers into A.
        LDArr: function(r1, r2) {
            Z80.reg.a = MMU.rb((Z80.reg[r1] << 8) + Z80.reg[r2]);
            Z80.reg.m = 2; 
        },
        // LD A,nn: load address denoted by 16-bit immediate into A.
        LDAnn: function() {
            Z80.reg.a = MMU.rb(MMU.rw(Z80.reg.pc++));
            Z80.reg.pc++;
            Z80.reg.m = 4; 
        },
        // LD rr,A: copy A to address denoted by two registers.
        LDrrA: function(r1, r2) {
            MMU.wb((Z80.reg[r1] << 8) + Z80.reg[r2], Z80.reg.a);
            Z80.reg.m = 2; 
        },
        // LD nn,A: copy A to address denoted by 16-bit immediate.
        LDnnA: function() {
            MMU.wb(MMU.rw(Z80.reg.pc++), Z80.reg.a);
            Z80.reg.pc++;
            Z80.reg.m = 4; 
        },
        // LD A,(C): load byte at address (0xFF00 + C) into A.
        LDACa: function() {
            Z80.reg.a = MMU.rb(0xFF00 + Z80.reg.c);
            Z80.reg.m = 2; 
        },
        // LD (C),A: copy A into address (0xFF00 + C).
        LDCaA: function() {
            MMU.wb(0xFF00 + Z80.reg.c, Z80.reg.a);
            Z80.reg.m = 2; 
        },
        // LDD A,(HL): load byte at address (HL) into A. Decrement HL.
        LDDAHL: function() {
            Z80.reg.a = MMU.rb((Z80.reg.h << 8) + Z80.reg.l);
            Z80.reg.l = (Z80.reg.l-1)&255;
            if (Z80.reg.l == 255) {
                Z80.reg.h = (Z80.reg.h-1)&255;
            }
            Z80.reg.m = 2; 
        },
        // LDD (HL),A: copy A into byte at address (HL). Decrement HL.
        LDDHLA: function() {
            MMU.wb((Z80.reg.h << 8) + Z80.reg.l, Z80.reg.a);
            Z80.reg.l = (Z80.reg.l-1)&255;
            if (Z80.reg.l == 255) {
                Z80.reg.h = (Z80.reg.h-1)&255;
            }
            Z80.reg.m = 2; 
        },
        // LDI A,(HL): load byte at address (HL) into A. Increment HL.
        LDIAHL: function() {
            Z80.reg.a = MMU.rb((Z80.reg.h << 8) + Z80.reg.l);
            Z80.reg.l = (Z80.reg.l+1)&255;
            if (!(Z80.reg.l))
                Z80.reg.h = (Z80.reg.h+1)&255;
            Z80.reg.m = 2; 
        },
        // LDI (HL),A: copy A into byte at address (HL). Increment HL.
        LDIHLA: function() {
            MMU.wb((Z80.reg.h << 8) + Z80.reg.l, Z80.reg.a);
            Z80.reg.l = (Z80.reg.l+1)&255;
            if (!(Z80.reg.l))
                Z80.reg.h = (Z80.reg.h+1)&255;
            Z80.reg.m = 2; 
        },
        // LDH (n),A: copy A into byte at address (0xFF00+n), where n is an 8-bit immediate value.
        LDHnA: function() {
            MMU.wb(0xFF00+MMU.rb(Z80.reg.pc++), Z80.reg.a);
            Z80.reg.m = 3; 
        },
        // LDH A,(n): load byte at address (0xFF00+n) into A, where n is an 8-bit immediate value.
        LDHAn: function() {
            Z80.reg.a = MMU.rb(0xFF00+MMU.rb(Z80.reg.pc++));
            Z80.reg.m = 3; 
        },

        // 16-bit loads
        // LD rr,nn: load 16-bit immediate n into two registers.
        LDrrnn: function(r1, r2) {
            Z80.reg[r2] = MMU.rb(Z80.reg.pc++);
            Z80.reg[r1] = MMU.rb(Z80.reg.pc++);
            Z80.reg.m = 3; 
        },
        // LD SP,nn: load 16-bit immediate n into the stack pointer.
        LDSPnn: function() {
            Z80.reg.sp = MMU.rw(Z80.reg.pc);
            Z80.reg.pc += 2;
            Z80.reg.m = 3; 
        },
        // LD SP,HL: copy HL into the stack pointer.
        LDSPHL: function() {
            Z80.reg.sp = (Z80.reg.h << 8) + Z80.reg.l;
            Z80.reg.m = 2; 
        },
        // LDHL SP,n: put SP + n into HL, where n is an 8-bit signed immediate.
        LDHLSPn: function() {
            var i = MMU.rb(Z80.reg.pc++);
            if (i > 127) i = -((~i+1)&255);
            i += Z80.reg.sp;
            Z80.reg.h = (i>>8)&255;
            Z80.reg.l = i&255;
            Z80.reg.m = 3; 
        },
        // LD (nn),SP: put SP at address denoted by 16-bit immediate nn.
        LDnnSP: function() {
            MMU.ww(MMU.rw(Z80.reg.pc), Z80.reg.sp);
            Z80.reg.pc += 2;
            Z80.reg.m = 5; 
        },
        // PUSH rr: push register pair rr onto stack.
        PUSHrr: function(r1, r2) {
            MMU.wb(--Z80.reg.sp, r1);
            MMU.wb(--Z80.reg.sp, r2);
            Z80.reg.m = 3; 
        },
        // POP rr: pop register pair rr from stack.
        POPrr: function(r1, r2) {
            Z80.reg[r2] = MMU.rb(Z80.reg.sp++);
            Z80.reg[r1] = MMU.rb(Z80.reg.sp++);
            Z80.reg.m = 3; 
        },

        // 8-bit ALU
        // ADD A,r: add register r to A.
        ADDAr: function(reg) {
            var a = Z80.reg.a;
            Z80.reg.a += Z80.reg[reg];
            Z80.reg.f = (Z80.reg.a>255) ? 0x10 : 0;
            Z80.reg.a &= 255;
            if(!Z80.reg.a) Z80.reg.f|=0x80;
            if((Z80.reg.a ^ Z80.reg[reg] ^ a) & 0x10) Z80.reg.f|=0x20;
            Z80.reg.m = 1;
        },
        // ADD A,(HL): add byte at (HL) to A.
        ADDAHL: function() {
            var a = Z80.reg.a;
            var hl = MMU.rb((Z80.reg.h<<8) + Z80.reg.l);
            Z80.reg.a += hl;
            Z80.reg.f = (Z80.reg.a>255) ? 0x10 : 0;
            Z80.reg.a &= 255;
            if (!Z80.reg.a) Z80.reg.f |= 0x80;
            if ((Z80.reg.a ^ hl ^ a) & 0x10) Z80.reg.f |= 0x20;
            Z80.reg.m = 2;
        },
        // ADD A,n: add 8-bit immediate n to A.
        ADDAn: function() {
            var a = Z80.reg.a;
            var n = MMU.rb(Z80.reg.pc++);
            Z80.reg.a += n;
            Z80.reg.f = (Z80.reg.a>255) ? 0x10 : 0;
            Z80.reg.a &= 255;
            if (!Z80.reg.a) Z80.reg.f |= 0x80;
            if ((Z80.reg.a ^ n ^ a) & 0x10) Z80.reg.f |= 0x20;
            Z80.reg.m = 2;
        },
        // ADC A,r: add register r + carry to A.
        ADCAr: function(reg) {
            var a = Z80.reg.a;
            Z80.reg.a += Z80.reg[reg];
            Z80.reg.a += (Z80.reg.f&0x10)>>4;
            Z80.reg.f = (Z80.reg.a>255) ? 0x10 : 0;
            Z80.reg.a &= 255;
            if(!Z80.reg.a) Z80.reg.f|=0x80;
            if((Z80.reg.a ^ Z80.reg[reg] ^ a) & 0x10) Z80.reg.f|=0x20;
            Z80.reg.m = 1;
        },
        // ADC A,(HL): add (HL) + carry to A.
        ADCAHL: function() {
            var a = Z80.reg.a;
            var hl = MMU.rb((Z80.reg.h<<8) + Z80.reg.l);
            Z80.reg.a += hl;
            Z80.reg.a += (Z80.reg.f&0x10)>>4;
            Z80.reg.f = (Z80.reg.a>255) ? 0x10 : 0;
            Z80.reg.a &= 255;
            if (!Z80.reg.a) Z80.reg.f |= 0x80;
            if ((Z80.reg.a ^ hl ^ a) & 0x10) Z80.reg.f |= 0x20;
            Z80.reg.m = 2;
        },
        // ADC A,n: add n + carry to A.
        ADCAn: function() {
            var a = Z80.reg.a;
            var n = MMU.rb(Z80.reg.pc++);
            Z80.reg.a += n;
            Z80.reg.a += (Z80.reg.f&0x10)>>4;
            Z80.reg.f = (Z80.reg.a>255) ? 0x10 : 0;
            Z80.reg.a &= 255;
            if (!Z80.reg.a) Z80.reg.f |= 0x80;
            if ((Z80.reg.a ^ n ^ a) & 0x10) Z80.reg.f |= 0x20;
            Z80.reg.m = 2;
        },
        // SUB A,r: subtract register n from A.
        SUBAr: function(reg) {
            var a = Z80.reg.a;
            Z80.reg.a -= Z80.reg[reg];
            Z80.reg.f = (Z80.reg.a < 0) ? 0x50 : 0x40;
            Z80.reg.a &= 255;
            if(!Z80.reg.a) Z80.reg.f |= 0x80;
            if((Z80.reg.a ^ Z80.reg[reg] ^ a) & 0x10) Z80.reg.f |= 0x20;
            Z80.reg.m = 1;
        },
        // SUB A,(HL): subtract (HL) from A.
        SUBAHL: function() {
            var a = Z80.reg.a;
            var m = MMU.rb((Z80.reg.h << 8) + Z80.reg.l);
            Z80.reg.a -= m;
            Z80.reg.f = (Z80.reg.a < 0) ? 0x50 : 0x40;
            Z80.reg.a &= 255;
            if(!Z80.reg.a) Z80.reg.f |= 0x80;
            if((Z80.reg.a ^ m ^ a) & 0x10) Z80.reg.f |= 0x20;
            Z80.reg.m = 2;
        },
        // SUB A,n: subtract n from A.
        SUBAn: function() {
            var a = Z80.reg.a;
            var m = MMU.rb(Z80.reg.pc++);
            Z80.reg.a -= m;
            Z80.reg.f = (Z80.reg.a < 0) ? 0x50 : 0x40;
            Z80.reg.a &= 255;
            if(!Z80.reg.a) Z80.reg.f |= 0x80;
            if((Z80.reg.a ^ m ^ a) & 0x10) Z80.reg.f |= 0x20;
            Z80.reg.m = 2;
        },
        // SBC A,r: subtract register r + carry from A.
        SBCAr: function(reg) {
            var a = Z80.reg.a;
            Z80.reg.a -= Z80.reg[reg];
            Z80.reg.a -= (Z80.reg.f&0x10)>>4;
            Z80.reg.f = (Z80.reg.a < 0) ? 0x50 : 0x40;
            Z80.reg.a &= 255;
            if(!Z80.reg.a) Z80.reg.f |= 0x80;
            if((Z80.reg.a ^ Z80.reg[reg] ^ a) & 0x10) Z80.reg.f |= 0x20;
            Z80.reg.m = 1;
        },
        // SBC A,(HL): subtract (HL) + carry from A.
        SBCAHL: function() {
            var a = Z80.reg.a;
            var m = MMU.rb((Z80.reg.h << 8) + Z80.reg.l);
            Z80.reg.a -= m;
            Z80.reg.a -= (Z80.reg.f&0x10)>>4;
            Z80.reg.f = (Z80.reg.a < 0) ? 0x50 : 0x40;
            Z80.reg.a &= 255;
            if(!Z80.reg.a) Z80.reg.f |= 0x80;
            if((Z80.reg.a ^ m ^ a) & 0x10) Z80.reg.f |= 0x20;
            Z80.reg.m = 2;
        },
        // SBC A,n: subtract n + carry from A.
        SBCAn: function() {
            var a = Z80.reg.a;
            var m = MMU.rb(Z80.reg.pc++);
            Z80.reg.a -= m;
            Z80.reg.a -= (Z80.reg.f&0x10)>>4;
            Z80.reg.f = (Z80.reg.a < 0) ? 0x50 : 0x40;
            Z80.reg.a &= 255;
            if(!Z80.reg.a) Z80.reg.f |= 0x80;
            if((Z80.reg.a ^ m ^ a) & 0x10) Z80.reg.f |= 0x20;
            Z80.reg.m = 2;
        },
        // AND A,r: AND A with register r.
        ANDAr: function(reg) {
            Z80.reg.a &= Z80.reg[reg];
            Z80.reg.f = 0x20;
            if (!Z80.reg.a) Z80.reg.f |= 0x80;
            Z80.reg.m = 1;
        },
        // AND A,(HL): AND A with (HL).
        ANDAHL: function() {
            Z80.reg.a &= MMU.rb((Z80.reg.h << 8) + Z80.reg.l);
            Z80.reg.f = 0x20;
            if (!Z80.reg.a) Z80.reg.f |= 0x80;
            Z80.reg.m = 2;
        },
        // AND A,n: AND A with n.
        ANDAn: function() {
            Z80.reg.a &= MMU.rb(Z80.reg.pc++);
            Z80.reg.f = 0x20;
            if (!Z80.reg.a) Z80.reg.f |= 0x80;
            Z80.reg.m = 2;
        },
        // OR A,r: OR A with register r.
        ORAr: function(reg) {
            Z80.reg.a |= Z80.reg[reg];
            Z80.reg.f = 0;
            if (!Z80.reg.a) Z80.reg.f |= 0x80;
            Z80.reg.m = 1;
        },
        // OR A,(HL): OR A with (HL).
        ORAHL: function() {
            Z80.reg.a |= MMU.rb((Z80.reg.h << 8) + Z80.reg.l);
            Z80.reg.f = 0;
            if (!Z80.reg.a) Z80.reg.f |= 0x80;
            Z80.reg.m = 2;
        },
        // OR A,n: OR A with n.
        ORAn: function() {
            Z80.reg.a |= MMU.rb(Z80.reg.pc++);
            Z80.reg.f = 0;
            if (!Z80.reg.a) Z80.reg.f |= 0x80;
            Z80.reg.m = 2;
        },
        // XOR A,r: XOR A with register r.
        XORAr: function(reg) {
            Z80.reg.a ^= Z80.reg[reg];
            Z80.reg.f = 0;
            if (!Z80.reg.a) Z80.reg.f |= 0x80;
            Z80.reg.m = 1;
        },
        // XOR A,(HL): XOR A with (HL).
        XORAHL: function() {
            Z80.reg.a ^= MMU.rb((Z80.reg.h << 8) + Z80.reg.l);
            Z80.reg.f = 0;
            if (!Z80.reg.a) Z80.reg.f |= 0x80;
            Z80.reg.m = 2;
        },
        // XOR A,n: XOR A with n.
        XORAn: function() {
            Z80.reg.a ^= MMU.rb(Z80.reg.pc++);
            Z80.reg.f = 0;
            if (!Z80.reg.a) Z80.reg.f |= 0x80;
            Z80.reg.m = 2;
        },
        // CP A,r: compare A with register r.
        CPAr: function(reg) {
            var i = Z80.reg.a - Z80.reg[reg];
            Z80.reg.f = (i < 0) ? 0x50 : 0x40;
            i &= 255;
            if (!i) Z80.reg.f |= 0x80;
            if ((Z80.reg.a ^ Z80.reg[reg] ^ i) & 0x10) Z80.reg.f |= 0x20;
            Z80.reg.m = 1;
        },
        // CP A,(HL): compare A with (HL).
        CPAHL: function() {
            var m = MMU.rb((Z80.reg.h << 4) + Z80.reg.l);
            var i = Z80.reg.a - m;
            Z80.reg.f = (i < 0) ? 0x50 : 0x40;
            i &= 255;
            if (!i) Z80.reg.f |= 0x80;
            if ((Z80.reg.a ^ m ^ i) & 0x10) Z80.reg.f |= 0x20;
            Z80.reg.m = 2;
        },
        // CP A,n: compare A with n.
        CPAn: function() {
            var m = MMU.rb(Z80.reg.pc++);
            var i = Z80.reg.a - m;
            Z80.reg.f = (i < 0) ? 0x50 : 0x40;
            i &= 255;
            if (!i) Z80.reg.f |= 0x80;
            if ((Z80.reg.a ^ m ^ i) & 0x10) Z80.reg.f |= 0x20;
            Z80.reg.m = 2;
        },
        // INC r: increment register r.
        INCr: function(reg) {
            Z80.reg[reg]++;
            Z80.reg[reg] &= 255;
            Z80.reg.f &= 0x10;
            if (!Z80.reg[reg]) Z80.reg.f |= 0x80;
            if ((Z80.reg[reg] ^ ((Z80.reg[reg] - 1)&255)) & 0x10) Z80.reg.f |= 0x20;
            Z80.reg.m = 1;
        },
        // INC (HL): increment byte at (HL).
        INCHL: function() {
            var i = MMU.rb((Z80.reg.h << 8) + Z80.reg.l) + 1;
            i &= 255;
            MMU.wb((Z80.reg.h << 8) + Z80.reg.l, i);
            Z80.reg.f &= 0x10;
            if (!i) Z80.reg.f |= 0x80;
            if ((i ^ ((i - 1)&255)) & 0x10) Z80.reg.f |= 0x20;
            Z80.reg.m = 3;
        },
        // DEC r: decrement register r.
        DECr: function(reg) {
            Z80.reg[reg]--;
            Z80.reg[reg] &= 255;
            Z80.reg.f &= 0x10;
            Z80.reg.f |= 0x40;
            if (!Z80.reg[reg]) Z80.reg.f |= 0x80;
            if ((Z80.reg[reg] ^ ((Z80.reg[reg] + 1)&255)) & 0x10) Z80.reg.f |= 0x20;
            Z80.reg.m = 1;
        },
        // DEC (HL): decrement at (HL).
        DECHL: function() {
            var i = MMU.rb((Z80.reg.h << 8) + Z80.reg.l) - 1;
            i &= 255;
            MMU.wb((Z80.reg.h << 8) + Z80.reg.l, i);
            Z80.reg.f &= 0x10;
            Z80.reg.f |= 0x40;
            if (!i) Z80.reg.f |= 0x80;
            if ((i ^ ((i - 1)&255)) & 0x10) Z80.reg.f |= 0x20;
            Z80.reg.m = 3;
        },

        // 16-bit arithmetic
        // ADD HL,rr: adds register pair rr to HL.
        ADDHLrr: function(r1, r2) {
            var orighl = (Z80.reg.h << 8) + Z80.reg.l;
            var hl = orighl;
            hl += (Z80.reg[r1] << 8) + Z80.reg[r2];
            Z80.reg.f &= 0x80;
            if (hl > 65535) Z80.reg.f |= 0x10;
            if ((hl ^ orighl ^ ((Z80.reg[r1] << 8) + Z80.reg[r2])) & 0x1000) Z80.reg.f |= 0x20;
            Z80.reg.h = (hl>>8)&255;
            Z80.reg.l = hl&255;
            Z80.reg.m = 2;
        },
        // ADD HL,SP: adds stack pointer to HL.
        ADDHLSP: function() {
            var orighl = (Z80.reg.h << 8) + Z80.reg.l;
            var hl = orighl;
            hl += Z80.reg.sp;
            Z80.reg.f &= 0x80;
            if (hl > 65535) Z80.reg.f |= 0x10;
            if ((hl ^ orighl ^ Z80.reg.sp) & 0x1000) Z80.reg.f |= 0x20;
            Z80.reg.h = (hl>>8)&255;
            Z80.reg.l = hl&255;
            Z80.reg.m = 2;
        },
        // ADD SP,n: adds signed 8-bit immediate to SP.
        ADDSPn: function() {
            var n = MMU.rb(Z80.reg.pc++);
            if (n > 127) n = -((~n+1)&255);
            Z80.reg.sp += n;
            Z80.reg.sp &= 65535;
            Z80.reg.m = 4;
        },
        // INC rr: increment register pair rr.
        INCrr: function(r1, r2) {
            var rr = (Z80.reg[r1] << 8) + Z80.reg[r2];
            rr++;
            Z80.reg[r1] = (rr >> 8)&255;
            Z80.reg[r2] = rr&255;
            Z80.reg.m = 2;
        },
        // INC SP: increment stack pointer
        INCSP: function() {
            Z80.reg.sp++;
            Z80.reg.sp &= 65535;
            Z80.reg.m = 2;
        },
        // DEC rr: decrement register pair rr.
        DECrr: function(r1, r2) {
            var rr = (Z80.reg[r1] << 8) + Z80.reg[r2];
            rr--;
            Z80.reg[r1] = (rr >> 8)&255;
            Z80.reg[r2] = rr&255;
            Z80.reg.m = 2;
        },
        // DEC SP: decrement stack pointer
        DECSP: function() {
            Z80.reg.sp -= 1;
            Z80.reg.sp &= 65535;
            Z80.reg.m = 2;
        },

        // miscellaneous
        // SWAP r: swap upper and lower nibbles of register r.
        SWAPr: function(reg) {
            var r = Z80.reg[reg];
            Z80.reg[reg] = ((r&0x0F)<<4) | ((r&0xF0)>>4);
            Z80.reg.f = (Z80.reg[reg]) ? 0 : 0x80;
            Z80.reg.m = 2;
        },
        // SWAP (HL): swap upper and lower nibbles of byte at (HL).
        SWAPHL: function() {
            var i = MMU.rb((Z80.reg.h << 8) + Z80.reg.l);
            i = ((i&0x0F)<<4) | ((i&0xF0)>>4);
            MMU.wb((Z80.reg.h << 8) + Z80.reg.l, i);
            Z80.reg.f = (i) ? 0 : 0x80;
            Z80.reg.m = 4;
        },
        // DAA: Decimal adjust A.
        DAA: function() {
            var a=Z80.reg.a;
            if((Z80.reg.f & 0x20) || ((Z80.reg.a & 15) > 9)) Z80.reg.a += 6;
            Z80.reg.f &= 0x4F;
            if((Z80.reg.f & 0x20) || (a > 0x99)) {
                Z80.reg.a += 0x60;
                Z80.reg.f |= 0x10;
            }
            if (!Z80.reg.a) Z80.reg.f |= 0x80;
            Z80.reg.m = 1;
        },
        // CPL: complement A.
        CPL: function() {
            Z80.reg.a ^= 255;
            Z80.reg.f |= 0x60;
            Z80.reg.m = 1;
        },
        // CCF: complement carry flag.
        CCF: function() {
            Z80.reg.f ^= 0x10;
            Z80.reg.f &= 0x90;
            Z80.reg.m = 1;
        },
        // SCF: set carry flag.
        SCF: function() {
            Z80.reg.f &= 0x80;
            Z80.reg.f |= 0x10;
            Z80.reg.m = 1;
        },
        // HALT: halt until interrupt.
        HALT: function() {
            Z80.halt = 1;
            Z80.reg.m = 1;
        },
        // STOP: stop processor.
        STOP: function() {
            Z80.stop = 1;
            Z80.reg.m = 1;
        },
        // DI: disable interrupts.
        DI: function() {
            Z80.reg.ime = 0;
            Z80.reg.m = 1;
        },
        // EI: enable interrupts.
        EI: function() {
            Z80.reg.ime = 1;
            Z80.reg.m = 1;
        },
        // RLCA: rotate A left.
        RLCA: function() {
            var ci = Z80.reg.a & 0x80 ? 1 : 0;
            var co = Z80.reg.a & 0x80 ? 0x10 : 0;
            Z80.reg.a = (Z80.reg.a << 1) + ci;
            Z80.reg.a &= 255;
            Z80.reg.f = co;
            if (!Z80.reg.a) Z80.reg.f |= 0x80;
            Z80.reg.m = 1;
        },
        // RLA: rotate A left through carry flag.
        RLA: function() {
            var ci = Z80.reg.f & 0x80 ? 1 : 0;
            var co = Z80.reg.a & 0x80 ? 0x10 : 0;
            Z80.reg.a = (Z80.reg.a << 1) + ci;
            Z80.reg.a &= 255;
            Z80.reg.f = co;
            if (!Z80.reg.a) Z80.reg.f |= 0x80;
            Z80.reg.m = 1;
        },
        // RRCA: rotate A right.
        RRCA: function() {
            var ci = Z80.reg.a & 0x01 ? 0x80 : 0;
            var co = Z80.reg.a & 0x01 ? 0x10 : 0;
            Z80.reg.a = (Z80.reg.a >> 1) + ci;
            Z80.reg.a &= 255;
            Z80.reg.f = co;
            if (!Z80.reg.a) Z80.reg.f |= 0x80;
            Z80.reg.m = 1;
        },
        // RRA: rotate A right through carry flag.
        RRA: function() {
            var ci = Z80.reg.f & 0x10 ? 0x80 : 0;
            var co = Z80.reg.a & 0x01 ? 0x10 : 0;
            Z80.reg.a = (Z80.reg.a >> 1) + ci;
            Z80.reg.a &= 255;
            Z80.reg.f = co;
            if (!Z80.reg.a) Z80.reg.f |= 0x80;
            Z80.reg.m = 1;
        },
        // RLC r: rotate register r left.
        RLCr: function(reg) {
            var ci = Z80.reg[reg] & 0x80 ? 1 : 0;
            var co = Z80.reg[reg] & 0x80 ? 0x10 : 0;
            Z80.reg[reg] = (Z80.reg[reg] << 1) + ci;
            Z80.reg[reg] &= 255;
            Z80.reg.f = co;
            if (!Z80.reg[reg]) Z80.reg.f |= 0x80;
            Z80.reg.m = 2;
        },
        // RLC (HL): rotate byte at (HL) left
        RLCHL: function() {
            var m = MMU.rb((Z80.reg.h << 4) + Z80.reg.l);
            var ci = m & 0x80 ? 1 : 0;
            var co = m & 0x80 ? 0x10 : 0;
            m = (m << 1) + ci;
            m &= 255;
            MMU.wb((Z80.reg.h << 4) + Z80.reg.l, m);
            Z80.reg.f = co;
            if (!m) Z80.reg.f |= 0x80;
            Z80.reg.m = 4;
        },
        // RL r: rotate register r left through carry flag.
        RLr: function(reg) {
            var ci = Z80.reg.f & 0x80 ? 1 : 0;
            var co = Z80.reg[reg] & 0x80 ? 0x10 : 0;
            Z80.reg[reg] = (Z80.reg[reg] << 1) + ci;
            Z80.reg[reg] &= 255;
            Z80.reg.f = co;
            if (!Z80.reg[reg]) Z80.reg.f |= 0x80;
            Z80.reg.m = 2;
        },
        // RL (HL): rotate byte at (HL) left through carry flag.
        RLHL: function() {
            var m = MMU.rb((Z80.reg.h << 4) + Z80.reg.l);
            var ci = Z80.reg.f & 0x80 ? 1 : 0;
            var co = m & 0x80 ? 0x10 : 0;
            m = (m << 1) + ci;
            m &= 255;
            MMU.wb((Z80.reg.h << 4) + Z80.reg.l, m);
            Z80.reg.f = co;
            if (!m) Z80.reg.f |= 0x80;
            Z80.reg.m = 4;
        },
        // RRC r: rotate register r right.
        RRCr: function(reg) {
            var ci = Z80.reg[reg] & 0x01 ? 0x80 : 0;
            var co = Z80.reg[reg] & 0x01 ? 0x10 : 0;
            Z80.reg[reg] = (Z80.reg[reg] >> 1) + ci;
            Z80.reg[reg] &= 255;
            Z80.reg.f = co;
            if (!Z80.reg[reg]) Z80.reg.f |= 0x80;
            Z80.reg.m = 2;
        },
        // RRC (HL): rotate byte at (HL) right.
        RRCHL: function() {
            var m = MMU.rb((Z80.reg.h << 4) + Z80.reg.l);
            var ci = m & 1 ? 0x80 : 0;
            var co = m & 1 ? 0x10 : 0;
            m = (m << 1) + ci;
            m &= 255;
            MMU.wb((Z80.reg.h << 4) + Z80.reg.l, m);
            Z80.reg.f = co;
            if (!m) Z80.reg.f |= 0x80;
            Z80.reg.m = 4;
        },
        // RR r: rotate register r right through carry flag.
        RRr: function(reg) {
            var ci = Z80.reg.f & 0x10 ? 0x80 : 0;
            var co = Z80.reg[reg] & 0x01 ? 0x10 : 0;
            Z80.reg[reg] = (Z80.reg[reg] >> 1) + ci;
            Z80.reg[reg] &= 255;
            Z80.reg.f = co;
            if (!Z80.reg[reg]) Z80.reg.f |= 0x80;
            Z80.reg.m = 1;
        },
        // RR (HL): rotate byte at (HL) right through carry flag.
        RRHL: function() {
            var m = MMU.rb((Z80.reg.h << 4) + Z80.reg.l);
            var ci = Z80.reg.f & 0x10 ? 0x80 : 0;
            var co = m & 1 ? 0x10 : 0;
            m = (m << 1) + ci;
            m &= 255;
            MMU.wb((Z80.reg.h << 4) + Z80.reg.l, m);
            Z80.reg.f = co;
            if (!m) Z80.reg.f |= 0x80;
            Z80.reg.m = 4;
        },
        // SLA r: shift register r left into carry flag.
        SLAr: function(reg) {
            var co = Z80.reg[reg] & 0x80 ? 0x10 : 0;
            Z80.reg[reg] = (Z80.reg[reg] << 1) & 255;
            Z80.reg.f = co;
            if (!Z80.reg[reg]) Z80.reg.f |= 0x80;
            Z80.reg.m = 2;
        },
        // SLA (HL): shift byte at (HL) left into carry flag.
        SLAHL: function() {
            var m = MMU.rb((Z80.reg.h << 4) + Z80.reg.l);
            var co = m & 0x80 ? 0x10 : 0;
            m = (m << 1) & 255;
            MMU.wb((Z80.reg.h << 4) + Z80.reg.l, m);
            Z80.reg.f = co;
            if (!m) Z80.reg.f |= 0x80;
            Z80.reg.m = 4;
        },
        // SRA r: shift register r right into carry flag.
        SRAr: function(reg) {
            var ci = Z80.reg[reg] & 0x80;
            var co = Z80.reg[reg] & 1 ? 0x10 : 0;
            Z80.reg[reg] = ((Z80.reg[reg] >> 1) + ci) & 255;
            Z80.reg.f = co;
            if (!Z80.reg[reg]) Z80.reg.f |= 0x80;
            Z80.reg.m = 2;
        },
        // SRA (HL): shift byte at (HL) right into carry flag.
        SRAHL: function() {
            var m = MMU.rb((Z80.reg.h << 4) + Z80.reg.l);
            var ci = m & 0x80;
            var co = m & 1 ? 0x10 : 0;
            m = ((m >> 1) + ci) & 255;
            MMU.wb((Z80.reg.h << 4) + Z80.reg.l, m);
            Z80.reg.f = co;
            if (!m) Z80.reg.f |= 0x80;
            Z80.reg.m = 4;
        },
        // SRL r: shift register r right into carry flag, setting MSB to 0.
        SRLr: function(reg) {
            var co = Z80.reg[reg] & 1 ? 0x10 : 0;
            Z80.reg[reg] = (Z80.reg[reg] >> 1) & 255;
            Z80.reg.f = co;
            if (!Z80.reg[reg]) Z80.reg.f |= 0x80;
            Z80.reg.m = 2;
        },
        // SRL (HL): shift byte at (HL) right into carry flag, setting MSB to 0.
        SRLHL: function() {
            var m = MMU.rb((Z80.reg.h << 4) + Z80.reg.l);
            var co = m & 1 ? 0x10 : 0;
            m = (m >> 1) & 255;
            MMU.wb((Z80.reg.h << 4) + Z80.reg.l, m);
            Z80.reg.f = co;
            if (!m) Z80.reg.f |= 0x80;
            Z80.reg.m = 4;
        },

        // bit opcodes
        // BIT n,r: test bit n in register r.
        BITnr: function(n, reg) {
            Z80.reg.f &= 0x10;
            Z80.reg.f |= 0x20;
            if (!(Z80.reg[reg] & (1 << n))) Z80.reg.f |= 0x80;
            Z80.reg.m = 2;
        },
        // BIT n,(HL): test bit n in byte at (HL).
        BITnHL: function(n) {
            var m = MMU.rb((Z80.reg.h << 8) + Z80.reg.l);
            Z80.reg.f &= 0x10;
            Z80.reg.f |= 0x20;
            if (!(m & (1 << n))) Z80.reg.f |= 0x80;
            Z80.reg.m = 4;
        },
        // SET n,r: set bit n in register r.
        SETnr: function(n, reg) {
            Z80.reg[reg] |= (1 << n);
            Z80.reg.m = 2;
        },
        // SET n,(HL): set bit n in byte at (HL).
        SETnHL: function(n) {
            MMU.wb((Z80.reg.h << 8) + Z80.reg.l, MMU.rb((Z80.reg.h << 8) + Z80.reg.l) | (1 << n));
            Z80.reg.m = 4;
        },
        // RES n,r: reset bit n in register r.
        RESnr: function(n, reg) {
            Z80.reg[reg] &= (0xFF ^ (1 << n));
            Z80.reg.m = 2;
        },
        // RES n,(HL): reset bit n in byte at (HL).
        RESnHL: function(n) {
            MMU.wb((Z80.reg.h << 8) + Z80.reg.l, MMU.rb((Z80.reg.h << 8) + Z80.reg.l) & (0xFF ^ (1 << n)));
            Z80.reg.m = 4;
        },

        // jumps
        // JP nn: jump to 16-bit immediate nn.
        JPnn: function() {
            Z80.reg.pc = MMU.rw(Z80.reg.pc);
            Z80.reg.m = 3;
        },
        // JP NZ,nn: jump to 16-bit immediate nn if Z flag (F & 0x80) is reset.
        JPNZnn: function() {
            Z80.reg.m = 3;
            if (Z80.reg.f & 0x80) {
                Z80.reg.pc += 2;
            } else {
                Z80.reg.pc = MMU.rw(Z80.reg.pc);
                Z80.reg.m++;
            }
        },
        // JP Z,nn: jump to 16-bit immediate nn if Z flag (F & 0x80) is set.
        JPZnn: function() {
            Z80.reg.m = 3;
            if (Z80.reg.f & 0x80) {
                Z80.reg.pc = MMU.rw(Z80.reg.pc);
                Z80.reg.m++;
            } else {
                Z80.reg.pc += 2;
            }
        },
        // JP NC,nn: jump to 16-bit immediate nn if C flag (F & 0x10) is reset.
        JPNCnn: function() {
            Z80.reg.m = 3;
            if (Z80.reg.f & 0x10) {
                Z80.reg.pc += 2;
            } else {
                Z80.reg.pc = MMU.rw(Z80.reg.pc);
                Z80.reg.m++;
            }
        },
        // JP C,nn: jump to 16-bit immediate nn if C flag (F & 0x10) is set.
        JPCnn: function() {
            Z80.reg.m = 3;
            if (Z80.reg.f & 0x10) {
                Z80.reg.pc = MMU.rw(Z80.reg.pc);
                Z80.reg.m++;
            } else {
                Z80.reg.pc += 2;
            }
        },
        // JP (HL): jump to address (HL).
        JPHL: function() {
            Z80.reg.pc = (Z80.reg.h << 4) + Z80.reg.l;
            Z80.reg.m = 1;
        },
        // JR n: add n (signed 8-bit immediate) to current address and jump to it.
        JRn: function() {
            var n = MMU.rb(Z80.reg.pc++);
            if (n > 127) n = -((~n + 1) & 255);
            Z80.reg.pc += n;
            Z80.reg.m = 3;
        },
        // JR NZ,n: do JR n if not Z-flag.
        JRNZn: function() {
            var n = MMU.rb(Z80.reg.pc++);
            if (n > 127) n = -((~n + 1) & 255);
            Z80.reg.m = 2;
            if (!(Z80.reg.f & 0x80)) {
                Z80.reg.m++;
                Z80.reg.pc += n;
            }
        },
        // JR Z,n: do JR n if Z-flag.
        JRZn: function() {
            var n = MMU.rb(Z80.reg.pc++);
            if (n > 127) n = -((~n + 1) & 255);
            Z80.reg.m = 2;
            if (Z80.reg.f & 0x80) {
                Z80.reg.m++;
                Z80.reg.pc += n;
            }
        },
        // JR NC,n: do JR n if not C-flag.
        JRNCn: function() {
            var n = MMU.rb(Z80.reg.pc++);
            if (n > 127) n = -((~n + 1) & 255);
            Z80.reg.m = 2;
            if (!(Z80.reg.f & 0x10)) {
                Z80.reg.m++;
                Z80.reg.pc += n;
            }
        },
        // JR C,n: do JR n if C-flag.
        JRCn: function() {
            var n = MMU.rb(Z80.reg.pc++);
            if (n > 127) n = -((~n + 1) & 255);
            Z80.reg.m = 2;
            if (Z80.reg.f & 0x10) {
                Z80.reg.m++;
                Z80.reg.pc += n;
            }
        },

        // calls
        // CALL nn: push next instruction onto stack and then do JP nn.
        CALLnn: function() {
            Z80.reg.sp -= 2;
            MMU.ww(Z80.reg.sp, Z80.reg.pc+2);
            Z80.reg.pc = MMU.rw(Z80.reg.pc);
            Z80.reg.m = 6;
        },
        // CALL NZ,nn: do CALL nn if not Z-flag.
        CALLNZnn: function() {
            Z80.reg.m = 3;
            Z80.reg.pc += 2;
            if (!(Z80.reg.f & 0x80)) {
                Z80.reg.sp -= 2;
                MMU.ww(Z80.reg.sp, Z80.reg.pc);
                Z80.reg.pc = MMU.rw(Z80.reg.pc-2);
                Z80.reg.m += 3;
            }
        },
        // CALL Z,nn: do CALL nn if Z-flag.
        CALLZnn: function() {
            Z80.reg.m = 3;
            Z80.reg.pc += 2;
            if (Z80.reg.f & 0x80) {
                Z80.reg.sp -= 2;
                MMU.ww(Z80.reg.sp, Z80.reg.pc);
                Z80.reg.pc = MMU.rw(Z80.reg.pc-2);
                Z80.reg.m += 3;
            }
        },
        // CALL NC,nn: do CALL nn if not C-flag.
        CALLNCnn: function() {
            Z80.reg.m = 3;
            Z80.reg.pc += 2;
            if (!(Z80.reg.f & 0x10)) {
                Z80.reg.sp -= 2;
                MMU.ww(Z80.reg.sp, Z80.reg.pc);
                Z80.reg.pc = MMU.rw(Z80.reg.pc-2);
                Z80.reg.m += 3;
            }
        },
        // CALL C,nn: do CALL nn if C-flag.
        CALLCnn: function() {
            Z80.reg.m = 3;
            Z80.reg.pc += 2;
            if (Z80.reg.f & 0x10) {
                Z80.reg.sp -= 2;
                MMU.ww(Z80.reg.sp, Z80.reg.pc);
                Z80.reg.pc = MMU.rw(Z80.reg.pc-2);
                Z80.reg.m += 3;
            }
        },

        // restarts
        // RST n: jump to address n.
        RSTn: function(n) {
            Z80.reg.pc = n;
            Z80.reg.m = 4;
        },

        // returns
        // RET: pop two bytes from stack and jump to that address.
        RET: function() {
            Z80.reg.pc = MMU.rw(Z80.reg.sp);
            Z80.reg.sp += 2;
            Z80.reg.m = 4;
        },
        // RET NZ: do RET if not Z-flag.
        RETNZ: function() {
            Z80.reg.m = 2;
            if (!(Z80.reg.f & 0x80)) {
                Z80.reg.pc = MMU.rw(Z80.reg.sp);
                Z80.reg.sp += 2;
                Z80.reg.m += 3;
            }
        },
        // RET Z: do RET if Z-flag.
        RETZ: function() {
            Z80.reg.m = 2;
            if (Z80.reg.f & 0x80) {
                Z80.reg.pc = MMU.rw(Z80.reg.sp);
                Z80.reg.sp += 2;
                Z80.reg.m += 3;
            }
        },
        // RET NC: do RET if not C-flag.
        RETNC: function() {
            Z80.reg.m = 2;
            if (!(Z80.reg.f & 0x10)) {
                Z80.reg.pc = MMU.rw(Z80.reg.sp);
                Z80.reg.sp += 2;
                Z80.reg.m += 3;
            }
        },
        // RET C: do RET if C-flag.
        RETC: function() {
            Z80.reg.m = 2;
            if (Z80.reg.f & 0x10) {
                Z80.reg.pc = MMU.rw(Z80.reg.sp);
                Z80.reg.sp += 2;
                Z80.reg.m += 3;
            }
        },
        // RETI: do RET, then do EI.
        RETI: function() {
            Z80.reg.pc = MMU.rw(Z80.reg.sp);
            Z80.reg.sp += 2;
            Z80.reg.m = 4;
            Z80.reg.ime = 1;
        },
        CBMAP: function() {
            var op = MMU.rb(Z80.reg.pc++);
            Z80.cbmap[op]();
        },
        XX: function(num) {
            console.warn("Unknown opcode 0x" + num.toString(16).toUpperCase())
        }
    },
    execop: function() {
        var op = MMU.rb(Z80.reg.pc++);
        Z80.map[op]();
    },
    map: [],
    cbmap: []
};
Z80.map = [
    // 0x00
    Z80.ops.NOP, // NOP
    function(){Z80.ops.LDrrnn('b','c');}, // LD BC,nn
    function(){Z80.ops.LDrrA('b','c');}, // LD BC,A
    function(){Z80.ops.INCrr('b','c');}, // INC BC
    function(){Z80.ops.INCr('b');}, // INC B
    function(){Z80.ops.DECr('b');}, // DEC B
    function(){Z80.ops.LDrn('b');}, // LD B,n
    Z80.ops.RLCA, // RLCA
    Z80.ops.LDnnSP, // LD (nn),SP
    function(){Z80.ops.ADDHLrr('b','c');}, // ADD HL,BC
    function(){Z80.ops.LDArr('b','c');}, // LD A,(BC)
    function(){Z80.ops.DECrr('b','c');}, // DEC BC
    function(){Z80.ops.INCr('c');}, // INC C
    function(){Z80.ops.DECr('c');}, // DEC C
    function(){Z80.ops.LDrn('c');}, // LD C,n
    Z80.ops.RRCA, // RRCA

    // 0x10
    Z80.ops.STOP, // STOP
    function(){Z80.ops.LDrrnn('d','e');}, // LD DE,nn
    function(){Z80.ops.LDrrA('d','e');}, // LD (DE),A
    function(){Z80.ops.INCrr('d','e');}, // INC DE
    function(){Z80.ops.INCr('d');}, // INC D
    function(){Z80.ops.DECr('d');}, // DEC D
    function(){Z80.ops.LDrn('d');}, // LD D,n
    Z80.ops.RLA, // RLA
    Z80.ops.JRn, // JR n
    function(){Z80.ops.ADDHLrr('d','e');}, // ADD HL,DE
    function(){Z80.ops.LDArr('d','e');}, // LD A,(DE)
    function(){Z80.ops.DECrr('d','e');}, // DEC DE
    function(){Z80.ops.INCr('e');}, // INC E
    function(){Z80.ops.DECr('e');}, // DEC E
    function(){Z80.ops.LDrn('e');}, // LD E,n
    Z80.ops.RRA, // RRA

    // 0x20
    Z80.ops.JRNZn, // JR NZ,n
    function(){Z80.ops.LDrrnn('h','l');}, // LD HL,nn
    Z80.ops.LDIHLA, // LDI (HL),A
    function(){Z80.ops.INCrr('h','l');}, // INC HL
    function(){Z80.ops.INCr('h');}, // INC H
    function(){Z80.ops.DECr('h');}, // DEC H
    function(){Z80.ops.LDrn('h');}, // LD H,n
    Z80.ops.DAA, // DAA
    Z80.ops.JRZn, // JR Z,n
    function(){Z80.ops.ADDHLrr('h','l');}, // ADD HL,HL
    Z80.ops.LDIAHL, // LDI A,(HL)
    function(){Z80.ops.DECrr('h','l');}, // DEC HL
    function(){Z80.ops.INCr('l');}, // INC L
    function(){Z80.ops.DECr('l');}, // DEC L
    function(){Z80.ops.LDrn('l');}, // LD L,n
    Z80.ops.CPL, // CPL

    // 0x30
    Z80.ops.JRNCn, // JR NC,n
    Z80.ops.LDSPnn, // LD SP,nn
    Z80.ops.LDDHLA, // LDD (HL),A
    Z80.ops.INCSP, // INC SP
    Z80.ops.INCHL, // INC (HL)
    Z80.ops.DECHL, // DEC (HL)
    Z80.ops.LDHLn, // LD (HL),n
    Z80.ops.SCF, // SCF
    Z80.ops.JRCn, // JR C,n
    Z80.ops.ADDHLSP, // ADD HL,SP
    Z80.ops.LDDAHL, // LDD H,(HL)
    Z80.ops.DECSP, // DEC SP
    function(){Z80.ops.INCr('a');}, // INC A
    function(){Z80.ops.DECr('a');}, // DEC A
    function(){Z80.ops.LDrn('a');}, // LD A,n
    Z80.ops.CCF, // CCF

    // 0x40
    function(){Z80.ops.LDrr('b','b');}, // LD B,B (nop)
    function(){Z80.ops.LDrr('b','c');}, // LD B,C
    function(){Z80.ops.LDrr('b','d');}, // LD B,D
    function(){Z80.ops.LDrr('b','e');}, // LD B,E
    function(){Z80.ops.LDrr('b','h');}, // LD B,H
    function(){Z80.ops.LDrr('b','l');}, // LD B,L
    function(){Z80.ops.LDrHL('b');}, // LD B,(HL)
    function(){Z80.ops.LDrr('b','a');}, // LD B,A
    function(){Z80.ops.LDrr('c','b');}, // LD C,B
    function(){Z80.ops.LDrr('c','c');}, // LD C,C (nop)
    function(){Z80.ops.LDrr('c','d');}, // LD C,D
    function(){Z80.ops.LDrr('c','e');}, // LD C,E
    function(){Z80.ops.LDrr('c','h');}, // LD C,H
    function(){Z80.ops.LDrr('c','l');}, // LD C,L
    function(){Z80.ops.LDrHL('c');}, // LD C,(HL)
    function(){Z80.ops.LDrr('c','a');}, // LD C,A

    // 0x50
    function(){Z80.ops.LDrr('d','b');}, // LD D,B
    function(){Z80.ops.LDrr('d','c');}, // LD D,C
    function(){Z80.ops.LDrr('d','d');}, // LD D,D (nop)
    function(){Z80.ops.LDrr('d','e');}, // LD D,E
    function(){Z80.ops.LDrr('d','h');}, // LD D,H
    function(){Z80.ops.LDrr('d','l');}, // LD D,L
    function(){Z80.ops.LDrHL('d');}, // LD D,(HL)
    function(){Z80.ops.LDrr('d','a');}, // LD D,A
    function(){Z80.ops.LDrr('e','b');}, // LD E,B
    function(){Z80.ops.LDrr('e','c');}, // LD E,C
    function(){Z80.ops.LDrr('e','d');}, // LD E,D
    function(){Z80.ops.LDrr('e','e');}, // LD E,E (nop)
    function(){Z80.ops.LDrr('e','h');}, // LD E,H
    function(){Z80.ops.LDrr('e','l');}, // LD E,L
    function(){Z80.ops.LDrHL('e');}, // LD E,(HL)
    function(){Z80.ops.LDrr('e','a');}, // LD E,A
    
    // 0x60
    function(){Z80.ops.LDrr('h','b');}, // LD H,B
    function(){Z80.ops.LDrr('h','c');}, // LD H,C
    function(){Z80.ops.LDrr('h','d');}, // LD H,D
    function(){Z80.ops.LDrr('h','e');}, // LD H,E
    function(){Z80.ops.LDrr('h','h');}, // LD H,H (nop)
    function(){Z80.ops.LDrr('h','l');}, // LD H,L
    function(){Z80.ops.LDrHL('h');}, // LD H,(HL)
    function(){Z80.ops.LDrr('h','a');}, // LD H,A
    function(){Z80.ops.LDrr('l','b');}, // LD L,B
    function(){Z80.ops.LDrr('l','c');}, // LD L,C
    function(){Z80.ops.LDrr('l','d');}, // LD L,D
    function(){Z80.ops.LDrr('l','e');}, // LD L,E
    function(){Z80.ops.LDrr('l','h');}, // LD L,H
    function(){Z80.ops.LDrr('l','l');}, // LD L,L (nop)
    function(){Z80.ops.LDrHL('l');}, // LD L,(HL)
    function(){Z80.ops.LDrr('l','a');}, // LD L,A

    // 0x70
    function(){Z80.ops.LDHLr('b');}, // LD (HL),B
    function(){Z80.ops.LDHLr('c');}, // LD (HL),C
    function(){Z80.ops.LDHLr('d');}, // LD (HL),D
    function(){Z80.ops.LDHLr('e');}, // LD (HL),E
    function(){Z80.ops.LDHLr('h');}, // LD (HL),H
    function(){Z80.ops.LDHLr('l');}, // LD (HL),L
    Z80.ops.HALT, // HALT
    function(){Z80.ops.LDHLr('a');}, // LD (HL),A
    function(){Z80.ops.LDrr('a','b');}, // LD A,B
    function(){Z80.ops.LDrr('a','c');}, // LD A,C
    function(){Z80.ops.LDrr('a','d');}, // LD A,D
    function(){Z80.ops.LDrr('a','e');}, // LD A,E
    function(){Z80.ops.LDrr('a','h');}, // LD A,H
    function(){Z80.ops.LDrr('a','l');}, // LD A,L
    function(){Z80.ops.LDrHL('a');}, // LD A,(HL)
    function(){Z80.ops.LDrr('a','a');}, // LD A,A (nop)
    
    // 0x80
    function(){Z80.ops.ADDAr('b');}, // ADD A,B
    function(){Z80.ops.ADDAr('c');}, // ADD A,C
    function(){Z80.ops.ADDAr('d');}, // ADD A,D
    function(){Z80.ops.ADDAr('e');}, // ADD A,E
    function(){Z80.ops.ADDAr('h');}, // ADD A,H
    function(){Z80.ops.ADDAr('l');}, // ADD A,L
    Z80.ops.ADDAHL, // ADD A,(HL)
    function(){Z80.ops.ADDAr('a');}, // ADD A,A
    function(){Z80.ops.ADCAr('b');}, // ADC A,B
    function(){Z80.ops.ADCAr('c');}, // ADC A,C
    function(){Z80.ops.ADCAr('d');}, // ADC A,D
    function(){Z80.ops.ADCAr('e');}, // ADC A,E
    function(){Z80.ops.ADCAr('h');}, // ADC A,H
    function(){Z80.ops.ADCAr('l');}, // ADC A,L
    Z80.ops.ADCAHL, // ADC A,(HL)
    function(){Z80.ops.ADCAr('a');}, // ADC A,A

    // 0x90
    function(){Z80.ops.SUBAr('b');}, // SUB A,B
    function(){Z80.ops.SUBAr('c');}, // SUB A,C
    function(){Z80.ops.SUBAr('d');}, // SUB A,D
    function(){Z80.ops.SUBAr('e');}, // SUB A,E
    function(){Z80.ops.SUBAr('h');}, // SUB A,H
    function(){Z80.ops.SUBAr('l');}, // SUB A,L
    Z80.ops.SUBAHL, // SUB A,(HL)
    function(){Z80.ops.SUBAr('a');}, // SUB A,A
    function(){Z80.ops.SBCAr('b');}, // SBC A,B
    function(){Z80.ops.SBCAr('c');}, // SBC A,C
    function(){Z80.ops.SBCAr('d');}, // SBC A,D
    function(){Z80.ops.SBCAr('e');}, // SBC A,E
    function(){Z80.ops.SBCAr('h');}, // SBC A,H
    function(){Z80.ops.SBCAr('l');}, // SBC A,L
    Z80.ops.SBCAHL, // SBC A,(HL)
    function(){Z80.ops.SBCAr('a');}, // SBC A,A

    // 0xA0
    function(){Z80.ops.ANDAr('b');}, // AND B
    function(){Z80.ops.ANDAr('c');}, // AND C
    function(){Z80.ops.ANDAr('d');}, // AND D
    function(){Z80.ops.ANDAr('e');}, // AND E
    function(){Z80.ops.ANDAr('h');}, // AND H
    function(){Z80.ops.ANDAr('l');}, // AND L
    Z80.ops.ANDAHL, // AND (HL)
    function(){Z80.ops.ANDAr('a');}, // AND A (nop)
    function(){Z80.ops.XORAr('b');}, // XOR B
    function(){Z80.ops.XORAr('c');}, // XOR C
    function(){Z80.ops.XORAr('d');}, // XOR D
    function(){Z80.ops.XORAr('e');}, // XOR E
    function(){Z80.ops.XORAr('h');}, // XOR H
    function(){Z80.ops.XORAr('l');}, // XOR L
    Z80.ops.XORAHL, // XOR (HL)
    function(){Z80.ops.XORAr('a');}, // XOR A (A=0)

    // 0xB0
    function(){Z80.ops.ORAr('b');}, // OR B
    function(){Z80.ops.ORAr('c');}, // OR C
    function(){Z80.ops.ORAr('d');}, // OR D
    function(){Z80.ops.ORAr('e');}, // OR E
    function(){Z80.ops.ORAr('h');}, // OR H
    function(){Z80.ops.ORAr('l');}, // OR L
    Z80.ops.ORAHL, // OR (HL)
    function(){Z80.ops.ORAr('a');}, // OR A
    function(){Z80.ops.CPAr('b');}, // CP B
    function(){Z80.ops.CPAr('c');}, // CP C
    function(){Z80.ops.CPAr('d');}, // CP D
    function(){Z80.ops.CPAr('e');}, // CP E
    function(){Z80.ops.CPAr('h');}, // CP H
    function(){Z80.ops.CPAr('l');}, // CP L
    Z80.ops.CPAHL, // CP (HL)
    function(){Z80.ops.CPAr('a');}, // CP A

    // 0xC0
    Z80.ops.RETNZ, // RET NZ
    function(){Z80.ops.POPrr('b','c');}, // POP BC
    Z80.ops.JPNZnn, // JP NZ,nn
    Z80.ops.JPnn, // JP nn
    Z80.ops.CALLNZnn, // CALL NZ,nn
    function(){Z80.ops.PUSHrr('b','c');}, // PUSH BC
    Z80.ops.ADDAn, // ADD A,n
    function(){Z80.ops.RSTn(0x00);}, // RST 0
    Z80.ops.RETZ, // RET Z
    Z80.ops.RET, // RET
    Z80.ops.JPZnn, // JP Z,nn
    Z80.ops.CBMAP, // CB opcodes
    Z80.ops.CALLZnn, // CALL Z,nn
    Z80.ops.CALLnn, // CALL nn
    Z80.ops.ADCAn, // ADC A,n
    function(){Z80.ops.RSTn(0x08);}, // RST 8

    // 0xD0
    Z80.ops.RETNC, // RET NC
    function(){Z80.ops.POPrr('d','e');}, // POP DE
    Z80.ops.JPNCnn, // JP NC,nn
    function(){Z80.ops.XX(0xD3)}, // unknown opcode
    Z80.ops.CALLNCnn, // CALL NC,nn
    function(){Z80.ops.PUSHrr('d','e');}, // PUSH DE
    Z80.ops.SUBAn, // SUB A,n
    function(){Z80.ops.RSTn(0x10);}, // RST 10
    Z80.ops.RETC, // RET C
    Z80.ops.RETI, // RETI
    Z80.ops.JPCnn, // JP C,nn
    function(){Z80.ops.XX(0xDB);}, // unknown opcode
    Z80.ops.CALLCnn, // CALL C,nn
    function(){Z80.ops.XX(0xDD);}, // unknown opcode
    Z80.ops.SBCAn, // SBC A,n
    function(){Z80.ops.RSTn(0x18);}, // RST 18

    // 0xE0
    Z80.ops.LDHnA, // LDH (n),A
    function(){Z80.ops.POPrr('h','l');}, // POP HL
    Z80.ops.LDCaA, // LD (C),A
    function(){Z80.ops.XX(0xE3);}, // unknown opcode
    function(){Z80.ops.XX(0xE4);}, // unknown opcode
    function(){Z80.ops.PUSHrr('h','l');}, // PUSH HL
    Z80.ops.ANDAn, // AND n
    function(){Z80.ops.RSTn(0x20);}, // RST 20
    Z80.ops.ADDSPn, // ADD SP,d
    Z80.ops.JPHL, // JP (HL)
    Z80.ops.LDnnA, // LD (nn),A
    function(){Z80.ops.XX(0xEB);}, // unknown opcode
    function(){Z80.ops.XX(0xEC);}, // unknown opcode
    function(){Z80.ops.XX(0xED);}, // unknown opcode
    Z80.ops.XORAn, // XOR n
    function(){Z80.ops.RSTn(0x28);}, // RST 28

    // 0xF0
    Z80.ops.LDHAn, // LDH A,(n)
    function(){Z80.ops.POPrr('a','f');}, // POP AF
    Z80.ops.LDACa, // LD A,(C)
    Z80.ops.DI, // DI
    function(){Z80.ops.XX(0xF4);}, // unknown opcode
    function(){Z80.ops.PUSHrr('a','f');}, // PUSH AF
    Z80.ops.ORAn, // OR n
    function(){Z80.ops.RSTn(0x30);}, // RST 30
    Z80.ops.LDHLSPn, // LDHL SP,d
    Z80.ops.LDSPHL, // LD SP,HL
    Z80.ops.LDAnn, // LD A,(nn)
    Z80.ops.EI, // EI
    function(){Z80.ops.XX(0xFC);}, // unknown opcode
    function(){Z80.ops.XX(0xFD);}, // unknown opcode
    Z80.ops.CPAn, // CP n
    function(){Z80.ops.RSTn(0x38);} // RST 38
];

Z80.cbmap = [
    // 0xCB00
    function(){Z80.ops.RLCr('b');}, // RLC B
    function(){Z80.ops.RLCr('c');}, // RLC C
    function(){Z80.ops.RLCr('d');}, // RLC D
    function(){Z80.ops.RLCr('e');}, // RLC E
    function(){Z80.ops.RLCr('h');}, // RLC H
    function(){Z80.ops.RLCr('l');}, // RLC L
    Z80.ops.RLCHL, // RLC (HL)
    function(){Z80.ops.RLCr('a');}, // RLC A
    function(){Z80.ops.RRCr('b');}, // RRC B
    function(){Z80.ops.RRCr('c');}, // RRC C
    function(){Z80.ops.RRCr('d');}, // RRC D
    function(){Z80.ops.RRCr('e');}, // RRC E
    function(){Z80.ops.RRCr('h');}, // RRC H
    function(){Z80.ops.RRCr('l');}, // RRC L
    Z80.ops.RRCHL, // RRC (HL)
    function(){Z80.ops.RRCr('a');}, // RRC A
    
    // 0xCB10
    function(){Z80.ops.RLr('b');}, // RL B
    function(){Z80.ops.RLr('c');}, // RL C
    function(){Z80.ops.RLr('d');}, // RL D
    function(){Z80.ops.RLr('e');}, // RL E
    function(){Z80.ops.RLr('h');}, // RL H
    function(){Z80.ops.RLr('l');}, // RL L
    Z80.ops.RLHL, // RL (HL)
    function(){Z80.ops.RLr('a');}, // RL A
    function(){Z80.ops.RRr('b');}, // RR B
    function(){Z80.ops.RRr('c');}, // RR C
    function(){Z80.ops.RRr('d');}, // RR D
    function(){Z80.ops.RRr('e');}, // RR E
    function(){Z80.ops.RRr('h');}, // RR H
    function(){Z80.ops.RRr('l');}, // RR L
    Z80.ops.RRHL, // RR (HL)
    function(){Z80.ops.RRr('a');}, // RR A
    
    // 0xCB20
    function(){Z80.ops.SLAr('b');}, // SLA B
    function(){Z80.ops.SLAr('c');}, // SLA C
    function(){Z80.ops.SLAr('d');}, // SLA D
    function(){Z80.ops.SLAr('e');}, // SLA E
    function(){Z80.ops.SLAr('h');}, // SLA H
    function(){Z80.ops.SLAr('l');}, // SLA L
    Z80.ops.SLAHL, // SLA (HL)
    function(){Z80.ops.SLAr('a');}, // SLA A
    function(){Z80.ops.SRAr('b');}, // SRA B
    function(){Z80.ops.SRAr('c');}, // SRA C
    function(){Z80.ops.SRAr('d');}, // SRA D
    function(){Z80.ops.SRAr('e');}, // SRA E
    function(){Z80.ops.SRAr('h');}, // SRA H
    function(){Z80.ops.SRAr('l');}, // SRA L
    Z80.ops.SRAHL, // SRA (HL)
    function(){Z80.ops.SRAr('a');}, // SRA A

    // 0xCB30
    function(){Z80.ops.SWAPr('b');}, // SWAP B
    function(){Z80.ops.SWAPr('c');}, // SWAP C
    function(){Z80.ops.SWAPr('d');}, // SWAP D
    function(){Z80.ops.SWAPr('e');}, // SWAP E
    function(){Z80.ops.SWAPr('h');}, // SWAP H
    function(){Z80.ops.SWAPr('l');}, // SWAP L
    Z80.ops.SWAPHL, // SWAP (HL)
    function(){Z80.ops.SWAPr('a');}, // SWAP A
    function(){Z80.ops.SRLr('b');}, // SRL B
    function(){Z80.ops.SRLr('c');}, // SRL C
    function(){Z80.ops.SRLr('d');}, // SRL D
    function(){Z80.ops.SRLr('e');}, // SRL E
    function(){Z80.ops.SRLr('h');}, // SRL H
    function(){Z80.ops.SRLr('l');}, // SRL L
    Z80.ops.SRLHL, // SRL (HL)
    function(){Z80.ops.SRLr('a');}, // SRL A
    
    // 0xCB40
    function(){Z80.ops.BITnr(0,'b');}, // BIT 0,B
    function(){Z80.ops.BITnr(0,'c');}, // BIT 0,C
    function(){Z80.ops.BITnr(0,'d');}, // BIT 0,D
    function(){Z80.ops.BITnr(0,'e');}, // BIT 0,E
    function(){Z80.ops.BITnr(0,'h');}, // BIT 0,H
    function(){Z80.ops.BITnr(0,'l');}, // BIT 0,L
    function(){Z80.ops.BITnHL(0);}, // BIT 0,(HL)
    function(){Z80.ops.BITnr(0,'a');}, // BIT 0,A
    function(){Z80.ops.BITnr(1,'b');}, // BIT 1,B
    function(){Z80.ops.BITnr(1,'c');}, // BIT 1,C
    function(){Z80.ops.BITnr(1,'d');}, // BIT 1,D
    function(){Z80.ops.BITnr(1,'e');}, // BIT 1,E
    function(){Z80.ops.BITnr(1,'h');}, // BIT 1,H
    function(){Z80.ops.BITnr(1,'l');}, // BIT 1,L
    function(){Z80.ops.BITnHL(1);}, // BIT 1,(HL)
    function(){Z80.ops.BITnr(1,'a');}, // BIT 1,A
    
    // 0xCB50
    function(){Z80.ops.BITnr(2,'b');}, // BIT 2,B
    function(){Z80.ops.BITnr(2,'c');}, // BIT 2,C
    function(){Z80.ops.BITnr(2,'d');}, // BIT 2,D
    function(){Z80.ops.BITnr(2,'e');}, // BIT 2,E
    function(){Z80.ops.BITnr(2,'h');}, // BIT 2,H
    function(){Z80.ops.BITnr(2,'l');}, // BIT 2,L
    function(){Z80.ops.BITnHL(2);}, // BIT 2,(HL)
    function(){Z80.ops.BITnr(2,'a');}, // BIT 2,A
    function(){Z80.ops.BITnr(3,'b');}, // BIT 3,B
    function(){Z80.ops.BITnr(3,'c');}, // BIT 3,C
    function(){Z80.ops.BITnr(3,'d');}, // BIT 3,D
    function(){Z80.ops.BITnr(3,'e');}, // BIT 3,E
    function(){Z80.ops.BITnr(3,'h');}, // BIT 3,H
    function(){Z80.ops.BITnr(3,'l');}, // BIT 3,L
    function(){Z80.ops.BITnHL(3);}, // BIT 3,(HL)
    function(){Z80.ops.BITnr(3,'a');}, // BIT 3,A

    // 0xCB60
    function(){Z80.ops.BITnr(4,'b');}, // BIT 4,B
    function(){Z80.ops.BITnr(4,'c');}, // BIT 4,C
    function(){Z80.ops.BITnr(4,'d');}, // BIT 4,D
    function(){Z80.ops.BITnr(4,'e');}, // BIT 4,E
    function(){Z80.ops.BITnr(4,'h');}, // BIT 4,H
    function(){Z80.ops.BITnr(4,'l');}, // BIT 4,L
    function(){Z80.ops.BITnHL(4);}, // BIT 4,(HL)
    function(){Z80.ops.BITnr(4,'a');}, // BIT 4,A
    function(){Z80.ops.BITnr(5,'b');}, // BIT 5,B
    function(){Z80.ops.BITnr(5,'c');}, // BIT 5,C
    function(){Z80.ops.BITnr(5,'d');}, // BIT 5,D
    function(){Z80.ops.BITnr(5,'e');}, // BIT 5,E
    function(){Z80.ops.BITnr(5,'h');}, // BIT 5,H
    function(){Z80.ops.BITnr(5,'l');}, // BIT 5,L
    function(){Z80.ops.BITnHL(5);}, // BIT 5,(HL)
    function(){Z80.ops.BITnr(5,'a');}, // BIT 5,A
    
    // 0xCB70
    function(){Z80.ops.BITnr(6,'b');}, // BIT 6,B
    function(){Z80.ops.BITnr(6,'c');}, // BIT 6,C
    function(){Z80.ops.BITnr(6,'d');}, // BIT 6,D
    function(){Z80.ops.BITnr(6,'e');}, // BIT 6,E
    function(){Z80.ops.BITnr(6,'h');}, // BIT 6,H
    function(){Z80.ops.BITnr(6,'l');}, // BIT 6,L
    function(){Z80.ops.BITnHL(6);}, // BIT 6,(HL)
    function(){Z80.ops.BITnr(6,'a');}, // BIT 6,A
    function(){Z80.ops.BITnr(7,'b');}, // BIT 7,B
    function(){Z80.ops.BITnr(7,'c');}, // BIT 7,C
    function(){Z80.ops.BITnr(7,'d');}, // BIT 7,D
    function(){Z80.ops.BITnr(7,'e');}, // BIT 7,E
    function(){Z80.ops.BITnr(7,'h');}, // BIT 7,H
    function(){Z80.ops.BITnr(7,'l');}, // BIT 7,L
    function(){Z80.ops.BITnHL(7);}, // BIT 7,(HL)
    function(){Z80.ops.BITnr(7,'a');}, // BIT 7,A
    
    // 0xCB80
    function(){Z80.ops.RESnr(0,'b');}, // RES 0,B
    function(){Z80.ops.RESnr(0,'c');}, // RES 0,C
    function(){Z80.ops.RESnr(0,'d');}, // RES 0,D
    function(){Z80.ops.RESnr(0,'e');}, // RES 0,E
    function(){Z80.ops.RESnr(0,'h');}, // RES 0,H
    function(){Z80.ops.RESnr(0,'l');}, // RES 0,L
    function(){Z80.ops.RESnHL(0);}, // RES 0,(HL)
    function(){Z80.ops.RESnr(0,'a');}, // RES 0,A
    function(){Z80.ops.RESnr(1,'b');}, // RES 1,B
    function(){Z80.ops.RESnr(1,'c');}, // RES 1,C
    function(){Z80.ops.RESnr(1,'d');}, // RES 1,D
    function(){Z80.ops.RESnr(1,'e');}, // RES 1,E
    function(){Z80.ops.RESnr(1,'h');}, // RES 1,H
    function(){Z80.ops.RESnr(1,'l');}, // RES 1,L
    function(){Z80.ops.RESnHL(1);}, // RES 1,(HL)
    function(){Z80.ops.RESnr(1,'a');}, // RES 1,A
    
    // 0xCB90
    function(){Z80.ops.RESnr(2,'b');}, // RES 2,B
    function(){Z80.ops.RESnr(2,'c');}, // RES 2,C
    function(){Z80.ops.RESnr(2,'d');}, // RES 2,D
    function(){Z80.ops.RESnr(2,'e');}, // RES 2,E
    function(){Z80.ops.RESnr(2,'h');}, // RES 2,H
    function(){Z80.ops.RESnr(2,'l');}, // RES 2,L
    function(){Z80.ops.RESnHL(2);}, // RES 2,(HL)
    function(){Z80.ops.RESnr(2,'a');}, // RES 2,A
    function(){Z80.ops.RESnr(3,'b');}, // RES 3,B
    function(){Z80.ops.RESnr(3,'c');}, // RES 3,C
    function(){Z80.ops.RESnr(3,'d');}, // RES 3,D
    function(){Z80.ops.RESnr(3,'e');}, // RES 3,E
    function(){Z80.ops.RESnr(3,'h');}, // RES 3,H
    function(){Z80.ops.RESnr(3,'l');}, // RES 3,L
    function(){Z80.ops.RESnHL(3);}, // RES 3,(HL)
    function(){Z80.ops.RESnr(3,'a');}, // RES 3,A
    
    // 0xCBA0
    function(){Z80.ops.RESnr(4,'b');}, // RES 4,B
    function(){Z80.ops.RESnr(4,'c');}, // RES 4,C
    function(){Z80.ops.RESnr(4,'d');}, // RES 4,D
    function(){Z80.ops.RESnr(4,'e');}, // RES 4,E
    function(){Z80.ops.RESnr(4,'h');}, // RES 4,H
    function(){Z80.ops.RESnr(4,'l');}, // RES 4,L
    function(){Z80.ops.RESnHL(4);}, // RES 4,(HL)
    function(){Z80.ops.RESnr(4,'a');}, // RES 4,A
    function(){Z80.ops.RESnr(5,'b');}, // RES 5,B
    function(){Z80.ops.RESnr(5,'c');}, // RES 5,C
    function(){Z80.ops.RESnr(5,'d');}, // RES 5,D
    function(){Z80.ops.RESnr(5,'e');}, // RES 5,E
    function(){Z80.ops.RESnr(5,'h');}, // RES 5,H
    function(){Z80.ops.RESnr(5,'l');}, // RES 5,L
    function(){Z80.ops.RESnHL(5);}, // RES 5,(HL)
    function(){Z80.ops.RESnr(5,'a');}, // RES 5,A
    
    // CBB0
    function(){Z80.ops.RESnr(6,'b');}, // RES 6,B
    function(){Z80.ops.RESnr(6,'c');}, // RES 6,C
    function(){Z80.ops.RESnr(6,'d');}, // RES 6,D
    function(){Z80.ops.RESnr(6,'e');}, // RES 6,E
    function(){Z80.ops.RESnr(6,'h');}, // RES 6,H
    function(){Z80.ops.RESnr(6,'l');}, // RES 6,L
    function(){Z80.ops.RESnHL(6);}, // RES 6,(HL)
    function(){Z80.ops.RESnr(6,'a');}, // RES 6,A
    function(){Z80.ops.RESnr(7,'b');}, // RES 7,B
    function(){Z80.ops.RESnr(7,'c');}, // RES 7,C
    function(){Z80.ops.RESnr(7,'d');}, // RES 7,D
    function(){Z80.ops.RESnr(7,'e');}, // RES 7,E
    function(){Z80.ops.RESnr(7,'h');}, // RES 7,H
    function(){Z80.ops.RESnr(7,'l');}, // RES 7,L
    function(){Z80.ops.RESnHL(7);}, // RES 7,(HL)
    function(){Z80.ops.RESnr(7,'a');}, // RES 7,A

    // 0xCBC0
    function(){Z80.ops.SETnr(0,'b');}, // SET 0,B
    function(){Z80.ops.SETnr(0,'c');}, // SET 0,C
    function(){Z80.ops.SETnr(0,'d');}, // SET 0,D
    function(){Z80.ops.SETnr(0,'e');}, // SET 0,E
    function(){Z80.ops.SETnr(0,'h');}, // SET 0,H
    function(){Z80.ops.SETnr(0,'l');}, // SET 0,L
    function(){Z80.ops.SETnHL(0);}, // SET 0,(HL)
    function(){Z80.ops.SETnr(0,'a');}, // SET 0,A
    function(){Z80.ops.SETnr(1,'b');}, // SET 1,B
    function(){Z80.ops.SETnr(1,'c');}, // SET 1,C
    function(){Z80.ops.SETnr(1,'d');}, // SET 1,D
    function(){Z80.ops.SETnr(1,'e');}, // SET 1,E
    function(){Z80.ops.SETnr(1,'h');}, // SET 1,H
    function(){Z80.ops.SETnr(1,'l');}, // SET 1,L
    function(){Z80.ops.SETnHL(1);}, // SET 1,(HL)
    function(){Z80.ops.SETnr(1,'a');}, // SET 1,A
    
    // 0xCBD0
    function(){Z80.ops.SETnr(2,'b');}, // SET 2,B
    function(){Z80.ops.SETnr(2,'c');}, // SET 2,C
    function(){Z80.ops.SETnr(2,'d');}, // SET 2,D
    function(){Z80.ops.SETnr(2,'e');}, // SET 2,E
    function(){Z80.ops.SETnr(2,'h');}, // SET 2,H
    function(){Z80.ops.SETnr(2,'l');}, // SET 2,L
    function(){Z80.ops.SETnHL(2);}, // SET 2,(HL)
    function(){Z80.ops.SETnr(2,'a');}, // SET 2,A
    function(){Z80.ops.SETnr(3,'b');}, // SET 3,B
    function(){Z80.ops.SETnr(3,'c');}, // SET 3,C
    function(){Z80.ops.SETnr(3,'d');}, // SET 3,D
    function(){Z80.ops.SETnr(3,'e');}, // SET 3,E
    function(){Z80.ops.SETnr(3,'h');}, // SET 3,H
    function(){Z80.ops.SETnr(3,'l');}, // SET 3,L
    function(){Z80.ops.SETnHL(3);}, // SET 3,(HL)
    function(){Z80.ops.SETnr(3,'a');}, // SET 3,A
    
    // 0xCBE0
    function(){Z80.ops.SETnr(4,'b');}, // SET 4,B
    function(){Z80.ops.SETnr(4,'c');}, // SET 4,C
    function(){Z80.ops.SETnr(4,'d');}, // SET 4,D
    function(){Z80.ops.SETnr(4,'e');}, // SET 4,E
    function(){Z80.ops.SETnr(4,'h');}, // SET 4,H
    function(){Z80.ops.SETnr(4,'l');}, // SET 4,L
    function(){Z80.ops.SETnHL(4);}, // SET 4,(HL)
    function(){Z80.ops.SETnr(4,'a');}, // SET 4,A
    function(){Z80.ops.SETnr(5,'b');}, // SET 5,B
    function(){Z80.ops.SETnr(5,'c');}, // SET 5,C
    function(){Z80.ops.SETnr(5,'d');}, // SET 5,D
    function(){Z80.ops.SETnr(5,'e');}, // SET 5,E
    function(){Z80.ops.SETnr(5,'h');}, // SET 5,H
    function(){Z80.ops.SETnr(5,'l');}, // SET 5,L
    function(){Z80.ops.SETnHL(5);}, // SET 5,(HL)
    function(){Z80.ops.SETnr(5,'a');}, // SET 5,A
    
    // 0xCBF0
    function(){Z80.ops.SETnr(6,'b');}, // SET 6,B
    function(){Z80.ops.SETnr(6,'c');}, // SET 6,C
    function(){Z80.ops.SETnr(6,'d');}, // SET 6,D
    function(){Z80.ops.SETnr(6,'e');}, // SET 6,E
    function(){Z80.ops.SETnr(6,'h');}, // SET 6,H
    function(){Z80.ops.SETnr(6,'l');}, // SET 6,L
    function(){Z80.ops.SETnHL(6);}, // SET 6,(HL)
    function(){Z80.ops.SETnr(6,'a');}, // SET 6,A
    function(){Z80.ops.SETnr(7,'b');}, // SET 7,B
    function(){Z80.ops.SETnr(7,'c');}, // SET 7,C
    function(){Z80.ops.SETnr(7,'d');}, // SET 7,D
    function(){Z80.ops.SETnr(7,'e');}, // SET 7,E
    function(){Z80.ops.SETnr(7,'h');}, // SET 7,H
    function(){Z80.ops.SETnr(7,'l');}, // SET 7,L
    function(){Z80.ops.SETnHL(7);}, // SET 7,(HL)
    function(){Z80.ops.SETnr(7,'a');} // SET 7,A
];