"use strict";

const MOCK_HACKER_EVENTS = [
    {
        title: "The Morris Worm", 
        subtitle: "The first cyber attack began with good intentions and ended with unexpected consequences",
        group: "breach",
        start: "1-1-1988",
        end: "1-1-1988",
        description: `Morris, a student at Cornell Univeristy in the USA, claimed it his progeny was not aimed to harm but was made for the innocuous intent to determine the vastness of the cyberspace.
        Things went pear-shaped when a the worm encountered a critical error and morphed into a virus which replicated rapidly and began infecting other computers resulting in denial of service. The damage? 6000 computers were reportedly affected causing an estimated $10-$100 million dollars in repair bills.`,
        breachType: "hacked",
        url:"https://gomindsight.com/insights/blog/history-of-cyber-attacks-2018/"
    },
    {
        title: "LA KIIS FM Porsche", 
        subtitle: "In an amusing cyber attack, Kevin Poulsen used his hacking ability to cheat in a radio contest.",
        group: "breach",
        start: "1-1-1995",
        end: "1-1-1995",
        description: "LA KIIS FM was giving away a Porsche to the 102nd caller, and Poulsen naturally wanted to win. He infiltrated the phone network to block their ability to receive calls, so Poulsen was assured the 102nd caller slot.",
        breachType: "hacked",
        url: "https://gomindsight.com/insights/blog/history-of-cyber-attacks-2018/"
    },
    {
        title: "Internet Attack", 
        subtitle: "In 2002, the internet was hit directly, marking a first in the history of cyber attacks.",
        group: "breach",
        start: "1-1-2002",
        end: "1-1-2002",
        description: "By targeting the thirteen Domain Name System (DNS) root servers, a DDoS attack assaulted the entire internet for an hour. While most users were unaffected, the DDoS attack could have shut down the internet if it had been sustained for a longer period.",
        breachType: "hacked",
        url: "https://gomindsight.com/insights/blog/history-of-cyber-attacks-2018/"
    }
];

module.exports.MOCK_HACKER_EVENTS = MOCK_HACKER_EVENTS;