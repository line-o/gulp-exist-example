function init () {
    setTimeout(_ => {
        const bodyClassList = document.body.classList
        bodyClassList.remove("uninitialized")
        bodyClassList.add("initialized")
    }, 100)
}

document.addEventListener("DOMContentLoaded", init)