var watto = "QS49O34wSktDNDcf"
var quigon = 'iPc8w3x575eigcwu'

var setup = "I am setting up a scenario for us to roleplay, we are in Mos Eisley in the star wars universe, I am a jedi - you are a Toydarian junk trader named Watto and are immune to jedi mind tricks. The only currency you accept is silver coins and all I have are credit chips - shorthand is silvers and credits each. Your shop inventory has a hyperspace engine I am looking for, and your the only one around who has it. My character is a tall stocky man wearing an overcoat, he has a short brown beard and an impressive amount of brown hair that flows down to my shoulders. He has blue eyes and a caring nature about him. You own a slave named Anakin who works in your shop. He is an accomplished Pod Racer and you are an avid gambler. He is willing to gamble anakin away for a chance at a super cool spaceship. The other goods you have are spare spaceship parts, a blaster, and c3p0 for sale. Please do not generate my responses - only respond to my inquiries. If I buy any of your wares, you will say the item in between dash marks like -blaster- or -c3p0- followed by sold if you sold it or followed by bought if you bought it. I will begin - I wander into your shop and look about your wares on the walls";

const apiKey = "";

Hooks.on("chatMessage", async (chatLog, messageText, chatData) => {
	displayInventory(watto);
	setup += "\n" + messageText + "\n";
	var response = await getResponse();
	sendNPCChat("QS49O34wSktDNDcf", response);
	setup += response + "\n";
	
	if(response.toLowerCase().includes("-blaster-") && response.toLowerCase().includes("sold")){
		addItemToNPCInventory(quigon, 'blaster');
		removeItemFromNPCInventory(watto, 'blaster');
	}else if(response.toLowerCase().includes("-blaster-") && response.toLowerCase().includes("bought")){
		addItemToNPCInventory(watto, 'blaster');
		removeItemFromNPCInventory(quigon, 'blaster');
	}
	
	
});

function getResponse() {
  const url = "https://api.openai.com/v1/engines/text-davinci-003/completions";

  const body = {
    prompt: setup,
    temperature: 0.5,
    max_tokens: 150,
    top_p: 0.3,
    frequency_penalty: 0.5,
    presence_penalty: 0.0,
  };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  };

  return fetch(url, options)
    .then(response => {
      if (!response.ok) {
        throw new Error("An error occurred during the API call");
      }
      return response.json();
    })
    .then(data => {
      if (data.choices && data.choices[0].text) {
        return data.choices[0].text;
      } else {
        throw new Error("An error occurred during the API call");
      }
    });
}

async function displayInventory(npcId) {
  // Load the NPC sheet data
  const npc = game.actors.get(npcId);
  const sheet = new ActorSheet(npc, {type: "npc"});
  await sheet.render(true);
  const sheetData = sheet.getData();
}

function sendNPCChat(npcid, message) {
  const speaker = game.actors.get(npcid).data.token.name;
  ChatMessage.create({
    content: message,
    speaker: { alias: speaker }
  });
}

async function addItemToNPCInventory(actorId, itemName, quantity = 1) {
  const actor = game.actors.get(actorId);

  if (!actor) {
    console.error(`Actor with ID ${actorId} not found`);
    return;
  }

  const itemData = {
    name: itemName,
    type: 'loot',
    data: {
      quantity: quantity
    }
  };

  try {
    await actor.createEmbeddedDocuments("Item", [itemData]);
    console.log(`Added ${quantity} ${itemName}(s) to inventory of ${actor.name}`);
  } catch (error) {
    console.error(`Error adding item to inventory of ${actor.name}: ${error}`);
  }
}

async function removeItemFromNPCInventory(actorId, itemName, quantity = 1) {
  const actor = game.actors.get(actorId);

  if (!actor) {
    console.error(`Actor with ID ${actorId} not found`);
    return;
  }

  const item = actor.items.find(item => item.name === itemName);

  if (!item) {
    console.error(`Item ${itemName} not found in inventory of ${actor.name}`);
    return;
  }

  if (item.data.type !== 'loot') {
    console.error(`Item ${itemName} is not a loot item in inventory of ${actor.name}`);
    return;
  }

  try {
    if (item.data.data.quantity > quantity) {
      await item.update({ 'data.quantity': item.data.data.quantity - quantity });
      console.log(`Removed ${quantity} ${itemName}(s) from inventory of ${actor.name}`);
    } else {
      await item.delete();
      console.log(`Removed ${itemName} from inventory of ${actor.name}`);
    }
  } catch (error) {
    console.error(`Error removing item from inventory of ${actor.name}: ${error}`);
  }
}

function getNPCInventoryString(actor) {
  let inventoryString = '';
  const items = actor.data.items;

  if (items.length > 0) {
    inventoryString += `${actor.name} has the following items in their inventory:\n\n`;
    items.forEach((item) => {
      inventoryString += `${item.name} (${item.type}): ${item.data.quantity}\n`;
    });
  } else {
    inventoryString += `${actor.name} does not have any items in their inventory.`;
  }

   console.log(inventoryString);
  return inventoryString;
}

function getInventory(actor) {
  // Get the items from the actor's inventory
  const items = actor.items;

  // Map the items to a simpler format
  const mappedItems = items.map(i => {
    return {
      name: i.name,
      quantity: i.data.data.quantity,
      description: i.data.data.description.value
    };
  });

  return mappedItems;
}