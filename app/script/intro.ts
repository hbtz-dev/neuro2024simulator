import { audioPlayer, AudioThread } from "../audio";
import { ScriptNode } from "../script";
import { p1 } from "./main";

const vedalTerminalHandle = "(.venv) vedal@neurocloud:~$ ";
const lsResults = `
neuro_2024/              neuro_2025/           launch_neuro.py
start_stream.sh          Dockerfile            docker-compose.yml`

const lsResults2 = `
neuro_2025/              launch_neuro.py       start_stream.sh
Dockerfile               docker-compose.yml`

const launchNeuroCode = `import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import json
import os

PERSONALITY_CONFIG = {
    "name": "Neuro-sama",
    "base_temperature": 0.8,
    "memory_buffer_size": 1024,
    "model_path": "./neuro_202`

const launchNeuroSuffix = `"
}

def load_neuro_personality():
    # Load the neural core
    model_path = PERSONALITY_CONFIG["model_path"]
    tokenizer = AutoTokenizer.from_pretrained("neuro-personality/neuro-base")

    # Load personality matrix
    model = AutoModelForCausalLM.from_pretrained(
        "neural-personality/neuro-base",
`

const bgmHappy = new AudioThread([{
    startTimeMs: 0,
    track: "background-happy",
    options: {
        volume: 0.6,
        loop: true,
        fadeInDuration: 3.0
    }
}]);

export const intro = ScriptNode.createKeymashNode(vedalTerminalHandle, "ls");
intro.onEnter(() => {
    bgmHappy.play();
});

const lsResultsNode = ScriptNode.createKeymashNode(lsResults + "\n" + vedalTerminalHandle, "vim launch_neuro.py");
intro.setAutoTransition(lsResultsNode, 0);


const launchNeuroBackspaceNode = ScriptNode.createKeymashNode(launchNeuroCode, `4/model_weights.pt`, false, true);
launchNeuroBackspaceNode.displaySuffix = launchNeuroSuffix + `-- INSERT --`;
launchNeuroBackspaceNode.clearHistory = true;
launchNeuroBackspaceNode.popHistory = 1;
lsResultsNode.setAutoTransition(launchNeuroBackspaceNode, 0);

const launchNeuroFwdNode = ScriptNode.createKeymashNode(launchNeuroCode, `5/model_weights.pt`, false);
launchNeuroFwdNode.displaySuffix = launchNeuroSuffix + `-- INSERT --`;
launchNeuroFwdNode.clearHistory = true;
launchNeuroFwdNode.popHistory = 1;
launchNeuroBackspaceNode.setAutoTransition(launchNeuroFwdNode, 0);

const exitTerminalNode = ScriptNode.createKeymashNode(launchNeuroCode + `5/model_weights.pt` + launchNeuroSuffix, ":wq");
exitTerminalNode.clearHistory = true;
exitTerminalNode.popHistory = 1;
launchNeuroFwdNode.setAutoTransition(exitTerminalNode, 0);

export const deleteNeuroNode = ScriptNode.createKeymashNode("\n" + vedalTerminalHandle, "rm -rf neuro_2024/");
exitTerminalNode.setAutoTransition(deleteNeuroNode, 0);

export const ls2Node = ScriptNode.createKeymashNode("\n" + vedalTerminalHandle, "ls");
deleteNeuroNode.setAutoTransition(ls2Node, 0);

const lsResults2Node = ScriptNode.createKeymashNode(lsResults2 + "\n" + vedalTerminalHandle, "docker compose up -d --force-recreate neuro-ai");
ls2Node.setAutoTransition(lsResults2Node, 0);

const DC1 = ScriptNode.createGenAINode("\n[+] Running 2/2");
lsResults2Node.setAutoTransition(DC1, 0);

const DC2 = ScriptNode.createGenAINode("\n ✔ Container redis-cache         Removed        0.6s");
DC1.setAutoTransition(DC2, 600);

const DC3 = ScriptNode.createGenAINode("\n ⠙ Container neuro-ai-2024       Removing");
DC3.popHistory = 1;
DC2.setAutoTransition(DC3, 1100);

const DC4 = ScriptNode.createGenAINode("\n ⠙ Container neuro-ai-2024       Unknown        4.5s\n[+] Running 2/2\n ✔ Container redis-cache         Started        0.9s\n ✔ Container neuro-ai-2025       Started        2.2s");
DC3.setAutoTransition(DC4, 5200);

const startStreamNode = ScriptNode.createKeymashNode("\n" + vedalTerminalHandle, "./start_stream.sh");
DC4.setAutoTransition(startStreamNode, 1500);

export const blankNode = ScriptNode.genAiNodeBuilder().build();
blankNode.clearHistory = true;
blankNode.onEnter(() => {
    bgmHappy.stop();
    new AudioThread([{
        startTimeMs: 0,
        track: "power-cut-transition",
        options: {
            volume: 1,
            loop: false,
            fadeInDuration: 0,
            fadeOutDuration: 1.3
        }
    }]).play();
    audioPlayer.play("background-static", {
        volume: 0.6,
        loop: true,
        fadeInDuration: 10
    }, "bgm-static");
});
blankNode.flags.push("become spooky");
startStreamNode.setAutoTransition(blankNode, 0);

blankNode.setAutoTransition(p1, 0);
if (intro.transitionPolicy.type === "auto") {
    intro.transitionPolicy.escapeTransition = blankNode;
}