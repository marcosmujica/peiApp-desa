import moment from "moment";

export function displayTime(timestamp) {
    var now = moment();
    var givenTime = moment(timestamp);
    var displayText;

    if (givenTime.isBefore(now, 'day')) {
        displayText = givenTime.fromNow(true);
    } else {
        displayText = givenTime.format('h:mm a');
    }

    return displayText;
}

export function ellipString(str, size) {
    if (str=="" || str==undefined) return
    if(str.length > size){
        return str.substring(0, size)+'...';
    }else{
        return str;
    }
}