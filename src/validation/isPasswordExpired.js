// Password update policy
function isPasswordExpired(lastPasswordUpdateDate) {
    const threeMonths = 90 * 24 * 60 * 60 * 1000; //90 * 24 * 60 * 60 * 1000; 60 * 60 * 1000;
    const timeout = new Date(lastPasswordUpdateDate) - new Date() + threeMonths;
    return (timeout < 0);
}
module.exports = isPasswordExpired;