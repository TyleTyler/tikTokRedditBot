const { Builder, By, until } = require("selenium-webdriver");
const fs =  require('fs').promises;
const imageSize = require('image-size');
const { createCanvas, loadImage } = require('canvas');

const getHTMLElement = async (driver, element) => {
    return driver.executeScript(`const elements = () => { return document.querySelector("${element}"); }; return elements()`);
};

const getHTMLElements = async (driver,element) => {
    return driver.findElements(By.css(element));
};

const getRedditScreenShot = async (url) =>{
    let driver;
    try{
        driver = new Builder().forBrowser("chrome").build();
        await driver.manage().window().maximize();
        await driver.get(url)
        const title = await getHTMLElement(driver, "h1")
        const titlePostRect = await driver.executeScript(`const elements = () => { return document.querySelector("h1").getBoundingClientRect(); }; return elements()`);
        
        
        const screenShot = await driver.takeScreenshot()
        const screenshotBuffer = Buffer.from(screenShot, 'base64');
        // Use image-size to get the dimensions of the original image
        const dimensions = imageSize(screenshotBuffer);

        // Specify the crop dimensions
        const cropOptions = {
            left: titlePostRect.x+ 65,
            top: titlePostRect.y + 30,
            width: titlePostRect.width + 200,  // Adjust the width as needed
            height: titlePostRect.height + 20 // Adjust the height as needed
        };

        // Use canvas to crop the image
        const canvas = createCanvas(cropOptions.width, cropOptions.height);
        const ctx = canvas.getContext('2d');
        const image = await loadImage(screenshotBuffer);
        ctx.drawImage(image, cropOptions.left, cropOptions.top, cropOptions.width, cropOptions.height, 0, 0, cropOptions.width, cropOptions.height);

        // Save the cropped image buffer to a file
        await fs.writeFile("cropped_screenshot.png", canvas.toBuffer());
    }catch(error){
        console.log("Error in getting screen shot:", error)
    }
}

(async ()=>{
    await getRedditScreenShot("https://www.reddit.com/r/AmItheAsshole/comments/19dsez4/aita_for_refusing_to_do_a_portrait_for_my_bf/")
})()