// Creates the blacklist according to the user's profile values
function updateBlackList(profile) {
    var blackList = ['password', '1234'];
    if (profile.firstName?.length > 3) {
        blackList.push(profile.firstName.substring(0, 3));
        blackList.push(profile.firstName.substring(profile.firstName.length - 3));
    }
    if (profile.lastName?.length > 3) {
        blackList.push(profile.lastName.substring(0, 3));
        blackList.push(profile.lastName.substring(profile.lastName.length - 3));
    }
    if (profile.username?.length > 3) {
        blackList.push(profile.username.substring(0, 3));
        blackList.push(profile.username.substring(profile.username.length - 3));
    }
    if (profile.email?.length > 3)
        blackList.push(profile.email.substring(0, 3));

    return blackList;
}

// The function that calculates the password strength
function getStrengthPassword(p, profile) {
    var stringReverse = function (str) {
        for (var i = str.length - 1, out = ''; i >= 0; out += str[i--]) { }
        return out;
    };

    var matches = { pos: {}, neg: {} };
    var counts = {
        pos: {},
        neg: {
            seqLetter: 0,
            seqNumber: 0,
            seqSymbol: 0
        }
    };

    const blackList = updateBlackList(profile);
    console.log('blackList =', blackList);

    var strength = 0,
        letters = 'abcdefghijklmnopqrstuvwxyz',
        numbers = '01234567890',
        symbols = '\\!@#$%&/()=?¿',
        tmp, back, forth, i;

    if (p) {
        // Benefits
        matches.pos.lower = p.match(/[a-z]/g);
        matches.pos.upper = p.match(/[A-Z]/g);
        matches.pos.numbers = p.match(/\d/g);
        matches.pos.symbols = p.match(/[$-/:-?{-~!^_`\[\]]/g);
        matches.pos.middleNumber = p.slice(1, -1).match(/\d/g);
        matches.pos.middleSymbol = p.slice(1, -1).match(/[$-/:-?{-~!^_`\[\]]/g);

        counts.pos.lower = matches.pos.lower ? matches.pos.lower.length : 0;
        counts.pos.upper = matches.pos.upper ? matches.pos.upper.length : 0;
        counts.pos.numbers = matches.pos.numbers ? matches.pos.numbers.length : 0;
        counts.pos.symbols = matches.pos.symbols ? matches.pos.symbols.length : 0;

        tmp = Object.keys(counts.pos).reduce(function (previous, key) {
            return previous + Math.min(1, counts.pos[key]);
        }, 0);
        console.log("tmp = ", tmp);
        counts.pos.numChars = p.length;
        tmp += (counts.pos.numChars >= 10) ? 1 : 0;

        counts.pos.requirements = tmp;
        counts.pos.middleNumber = matches.pos.middleNumber ? matches.pos.middleNumber.length : 0;
        counts.pos.middleSymbol = matches.pos.middleSymbol ? matches.pos.middleSymbol.length : 0;

        // Deductions
        matches.neg.consecLower = p.match(/(?=([a-z]{2}))/g);
        matches.neg.consecUpper = p.match(/(?=([A-Z]{2}))/g);
        matches.neg.consecNumbers = p.match(/(?=(\d{2}))/g);
        matches.neg.onlyNumbers = p.match(/^[0-9]*$/g);
        matches.neg.onlyLetters = p.match(/^([a-z]|[A-Z])*$/g);

        counts.neg.consecLower = matches.neg.consecLower ? matches.neg.consecLower.length : 0;
        counts.neg.consecUpper = matches.neg.consecUpper ? matches.neg.consecUpper.length : 0;
        counts.neg.consecNumbers = matches.neg.consecNumbers ? matches.neg.consecNumbers.length : 0;


        // sequential letters (back and forth)
        for (i = 0; i < letters.length - 2; i++) {
            var p2 = p.toLowerCase();
            forth = letters.substring(i, parseInt(i + 3));
            back = stringReverse(forth);
            if (p2.indexOf(forth) !== -1 || p2.indexOf(back) !== -1) {
                counts.neg.seqLetter++;
            }
        }

        // sequential numbers (back and forth)
        for (i = 0; i < numbers.length - 2; i++) {
            forth = numbers.substring(i, parseInt(i + 3));
            back = stringReverse(forth);
            if (p.indexOf(forth) !== -1 || p.toLowerCase().indexOf(back) !== -1) {
                counts.neg.seqNumber++;
            }
        }

        // sequential symbols (back and forth)
        for (i = 0; i < symbols.length - 2; i++) {
            forth = symbols.substring(i, parseInt(i + 3));
            back = stringReverse(forth);
            if (p.indexOf(forth) !== -1 || p.toLowerCase().indexOf(back) !== -1) {
                counts.neg.seqSymbol++;
            }
        }

        var repeats = {};
        var _p = p.toLowerCase();
        var arr = _p.split('');
        counts.neg.repeated = 0;
        for (i = 0; i < arr.length; i++) {
            tav = "[" + _p[i] + "]";
            var _reg = new RegExp(tav, 'g');
            var cnt = (_p.match(_reg) || "").length;
            if (cnt > 1 && !repeats[tav]) {
                repeats[tav] = cnt;
                counts.neg.repeated += cnt;
            }
        }

        counts.neg.onlyNumbers = matches.neg.onlyNumbers ? 1 : 0;
        counts.neg.onlyLetters = matches.neg.onlyLetters ? 1 : 0;

        counts.neg.blackList = 0;
        blackList.forEach(item => {
            if (p.indexOf(item) > -1)
                counts.neg.blackList++;
        });

        // Calculations
        if (counts.pos.requirements < 4 || counts.pos.numChars < 10) {
            return 0;
        }

        strength += counts.pos.numChars * 4;
        if (counts.pos.upper) {
            strength += (counts.pos.numChars - counts.pos.upper) * 2;
        }
        if (counts.pos.lower) {
            strength += (counts.pos.numChars - counts.pos.lower) * 2;
        }
        if (counts.pos.upper || counts.pos.lower) {
            strength += counts.pos.numbers * 4;
        }
        strength += counts.pos.symbols * 6;
        strength += (counts.pos.middleSymbol + counts.pos.middleNumber) * 2;
        if (counts.pos.requirements >= 4 && counts.pos.numChars >= 10) {
            strength += counts.pos.requirements * 2;
        }

        strength -= counts.neg.consecLower * 2;
        strength -= counts.neg.consecUpper * 2;
        strength -= counts.neg.consecNumbers * 2;
        strength -= counts.neg.seqNumber * 3;
        strength -= counts.neg.seqLetter * 3;
        strength -= counts.neg.seqSymbol * 3;

        if (matches.neg.onlyNumbers) {
            strength -= counts.pos.numChars;
        }
        if (matches.neg.onlyLetters) {
            strength -= counts.pos.numChars;
        }
        if (counts.neg.repeated) {
            temp = (counts.pos.numChars / (counts.pos.numChars - counts.neg.repeated / 1.4)) * 10;
            strength -= temp;
        }

        strength = Math.max(0, Math.min(100, Math.round(strength)));

        if (counts.neg.blackList > 0)
            strength = strength / 2;

        strength = Math.round(strength);
    }

    return strength;
}

module.exports = getStrengthPassword;