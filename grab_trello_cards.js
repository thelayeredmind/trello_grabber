const {key, token} = require('../../secrets/trello')["obsidian-transfer"];
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);


async function fetchTrello(route){
  const base_url = 'https://api.trello.com/1/'
  const auth = `?key=${key}&token=${token}`
  const url = base_url + route + auth
  const response = await fetch(url, {
    method: 'GET',
    headers: {'Accept': 'application/json'}
  })
  console.log({route, status: response.status});
  const json = response.json();
  return json;
}

function dirExists(filePath) {
  const dirname = path.dirname(filePath);
  console.log(`Does ${dirname} exist ?`);
  if (fs.existsSync(dirname)) {
    console.log("Yes! : " + path.resolve(dirname));
    return true;
  }
  console.log("No!");
  dirExists(dirname);
  fs.mkdirSync(dirname);
  console.log(`Created: ${dirname}`);
}

function fixName(name){
  return name.replaceAll(new RegExp(/[\s:\/,|]/g), "_").replaceAll(new RegExp(/[&"()'.?!]/g), "");
}

function queueProcesses(processes, timeout){
  console.log(`Waiting for ${timeout/1000} seconds...`);
  setTimeout(() => {
    const head = processes[0];
    if(head){
      head();
    } else {
      console.log("Done!")
      return
    }
    const tail = processes.slice(1);
    queueProcesses(tail, timeout);
  }, timeout);
}

async function write_card(card){
  const {desc, name, id, list} = card;
  console.log(`Processing ${name}...`);
  const attachments_trello = await fetchTrello(`/cards/${id}/attachments`);
  const attachments = attachments_trello.map(attachment => ({name: attachment.name , url: attachment.url}));
  const list2 = await fetchTrello(`lists/${list}`);
  const actions = await fetchTrello(`/cards/${id}/actions`);
  const notes = actions.map(action => action.data.text);
  const full_path = path.join(args[1] ? args[1] : path.join(".", "output", list2.name), `${fixName(name)}.md`);
  dirExists(full_path);
  const obsidian_note = fs.createWriteStream(full_path);
  console.log(`Writing to ${full_path}`);
  obsidian_note.write(desc + '\n\n\n');
  obsidian_note.write("## Attachments" + '\n\n\n');
  attachments.forEach(attachment => obsidian_note.write(`- [${attachment.name}](${attachment.url})\n`));
  obsidian_note.write("## Notes" + '\n\n\n');
  notes.forEach(note => obsidian_note.write(`${note}\n\n---\n\n`));
  obsidian_note.end();
}

async function get_stuff(){
  const boards = await fetchTrello('members/me/boards');
  const my_board = boards.map(board => ({name: board.name, id: board.id})).find(board => board.name.includes(args[0]));
  const target_board = await fetchTrello(`boards/${my_board.id}/cards`)
  const cards = target_board.map(card => ({name: card.name, id: card.id, desc: card.desc, list: card.idList}))
  const waitFor = (10/100 * 3) * 1000; // Rate is 100 requests per 10 seconds, per card I do three requests.
  queueProcesses(cards.map(card => () => write_card(card)), waitFor);
}

get_stuff()