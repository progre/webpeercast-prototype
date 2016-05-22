let datawindow: any = document.getElementById("datawindow");

export function log(msg: any) {
    let div = document.getElementById("datawindow");
    div.innerHTML = div.innerHTML + "<p>" + msg + "</p>";
}

export function fancy_log(msg: any, color: any) {
    let pre = document.createElement("p");
    let message = '<span style="color: ' + color + ';">' + msg + '</span>';
    pre.style.wordWrap = "break-word";
    pre.innerHTML = message;
    datawindow.appendChild(pre); // (window).* here doesn't work right

    pre.scrollIntoView(false);
}
