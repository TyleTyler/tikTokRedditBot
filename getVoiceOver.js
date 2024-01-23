const { Builder } = require("selenium-webdriver");
const fs = require('fs').promises;
const fetch = require('node-fetch');

const digestText = (text) => {
    const textList = [];
    let currentSentence = "";

    // Custom replacements
    const replacements = [
        { pattern: /(\d+)M(?=\D|$)/g, replacement: '$1 Male' },
        { pattern: /(\d+)F(?=\D|$)/g, replacement: '$1 Female' },
        { pattern: /AITA/g, replacement: 'am i the butthole' },
        { pattern: /TLDR/g, replacement: 'too long didn\'t read' },
        { pattern: /\$/g, replacement: 'dollars' },
        { pattern: /€/g, replacement: 'euros' },
        // Add more replacements as needed
    ];

    // Replace specific patterns in the text
    for (const { pattern, replacement } of replacements) {
        text = text.replace(pattern, replacement);
    }

    while (text.length > 0) {
        try {
            let periodIndex = text.indexOf(".");
            if (periodIndex !== -1) {
                let textPlaceHolder = text.substring(0, periodIndex + 1); // Include the period in the sentence
                if ((currentSentence + textPlaceHolder).length > 300) {
                    textList.push(currentSentence.trim()); // Add the current sentence to textList
                    currentSentence = ""; // Reset currentSentence for the next iteration
                }
                currentSentence += textPlaceHolder + " ";
                text = text.substring(periodIndex + 1).trim(); // Move to the next sentence and trim any leading whitespace
            } else {
                // No more periods found, break out of the loop
                break;
            }
        } catch (error) {
            console.log(error.message);
            console.log(currentSentence.length);
            console.log(text);
            break;
        }
    }

    // Add the last remaining text to textList if it's not empty
    if (currentSentence.trim().length > 0) {
        textList.push(currentSentence.trim());
    }

    return textList;
};

const makeVoiceOver = async (text) => {
    try {
        const response = await fetch("https://tiktok-tts.weilnet.workers.dev/api/generation", {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            referrerPolicy: "no-referrer",
            body: JSON.stringify({
                text: text,
                voice: "en_us_001"
            })
        });
        const data = await response.json();
        return Buffer.from(data.data, 'base64');
    } catch (error) {
        console.log("Error in getting voice over:", error);
        return new Uint8Array(0);
    }
};

// Function to append two Uint8Arrays
function appendBuffer(buffer1, buffer2) {
    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp;
}

const getVoiceOver = async (text) => {
    let combinedBuffer = new Uint8Array(0);

    try {
        const textPieces = digestText(text);

        for (const textPiece of textPieces) {
            const audioBuffer = await makeVoiceOver(textPiece);
            combinedBuffer = appendBuffer(combinedBuffer, audioBuffer);
        }

        await fs.writeFile(`./finishedRedditAudios/combinedRedditAudio.mp3`, combinedBuffer);
        console.log('Audio files appended and saved successfully.');
    } catch (error) {
        console.error('Error appending and saving audio files:', error);
    }
};

// Example usage
const redditText = "I am 16M and my friend is 16F we hang out frequently and every time we hang out she always has multiple a hundred dollar bills in her wallet and she will have her parents credit card. She doesn’t work either so one day out of curiosity I just asked her where she gets all the money from. I have been to her house before and her house is really nice, but her parents are Asian and I just didn’t feel like Asians were the type of people to just hand out money like that. I’m not being racist or anything but from what I know about their cultures and traditions giving out money to their kids who can work but don’t work just doesn’t seem like it’s part of their culture. She tells me her parents give her 500 dollars A WEEK and her dad lets her use his credit card. One day however we hung out and she was just ranting about her parents only gave her 250 for that week and they took away the credit card after she spent over 1500 dollars on it IN A WEEK. I didn’t say anything I just listened but for some reason I felt the need to put in my two cents. So I said why don’t you get a job like me, and she says “My parents are rich I will never need to work”. I then asked what are her plans after Highschool and she literally says that she plans to stay with her parents and she also added that when they die she will inherit their businesses. I hate thinking about one day my mom and stepdad will be gone and I will live in a world without them. To talk about your plans after your parents die just seems so wrong to me so I called her entitled and that she can’t expect her parents to give her money simply for just living. She doesn’t do chores either so like what work is she doing to earn hundreds of dollars each week. Nothing she is doing absolutely nothing except living in her parents house and eating their food and living off their money. No I am not jealous I actually enjoy working it takes my mind off of things and gives me a purpose. What I find crazy though is after I called her entitled she finally got a job so she must have realized how wrong she was for saying that. After I said that we don’t talk much anymore but I honestly don’t care I don’t see myself staying friends with someone so entitled.";
getVoiceOver(redditText);
