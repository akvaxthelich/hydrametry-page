import './style.css'

const fade = document.getElementById("fade");


export function fadeInOrOut(onDone){
    
    if(fade.classList.contains("active")){
        console.log("was active. active removed.")
        void fade.offsetHeight //force browser to take new style
        fade.classList.remove("active")
    }
    else if(!fade.classList.contains("active")){
        fade.classList.add("active")
        fade.addEventListener("transitionend", () => {
        onDone?.()

        }, {once: true})
    }
}

//screen bottom center text utils


//bottom text utils
const screenText = document.getElementById("screenText")
//change text
export function setScreenText(text){
    screenText.textContent = text

}

export function hideScreenText(){
    screenText.style.opacity = 0
}

export function showScreenText(){
    screenText.style.opacity = 1
}

export function screenTextFadeTo(text){
    hideScreenText()
    setScreenText(text)
    showScreenText()
}

const buttons = document.querySelectorAll("button")
buttons.forEach(btn => console.log(btn))
//force no transition on init state objects until load
export function buttonfadeIn(){        
        
        buttons.forEach(btn => btn.classList.add("active"))
}

const arm = () => {
    console.log("arming")
    fade.classList.add("ready")

    buttons.forEach(btn => btn.classList.add("ready"))

}
window.requestAnimationFrame(arm)

export function fadeAndNavigateTo(url){
        if(fade.classList.contains("active")){
        void fade.offsetHeight //force browser to take new style
        fade.classList.remove("active")
    }

    fade.addEventListener("transitionend", () => {
        window.location.href = url  
    }, {once: true})
}
window.fadeAndNavigateTo = fadeAndNavigateTo
