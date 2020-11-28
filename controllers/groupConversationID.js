function createGroupConversationId(membersArray, name) {
    let a = ""
    let b = ""
    membersArray.forEach(element => {
        b = element
        if (a < b) {
            a = `${a}${b}`
        } else {
            a = `${b}${a}`
        }
    });
    return `${a}${name}`
}

module.exports = createGroupConversationId;