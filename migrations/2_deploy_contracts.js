const OneTimeNotes = artifacts.require("OneTimeNotes");

module.exports = function (deployer) {
    deployer.deploy(OneTimeNotes);
};