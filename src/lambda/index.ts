import { MultiStringMap } from "./MultiStringMap";
import { Location } from "./Location";
import { ParserExample } from "./ParserExample";
import { ParserAlteRaffinerie } from "./ParserAlteRaffinerie";
import { ParserCrowns } from "./ParserCrowns";
import { ParserNachtkantine } from "./ParserNachtkantine";
import { Menu } from "./Menu";

import * as http from "http";
import * as Alexa from "alexa-sdk";

let locations: MultiStringMap<Location> = new MultiStringMap<Location>();

locations.put("Beispiel",
	new Location("zum Beispiel",
		null,
		new ParserExample()));

locations.multiPut(["Alte Raffinerie", "Alten Raffinerie", "Storchenburg"],
	new Location("in der Alten Raffinerie",
		"http://www.alte-raffinerie.de/index.php/Essen.html",
		new ParserAlteRaffinerie()));

locations.put("Crowns",
	new Location("im Crowns",
		"http://www.crownsrestaurant.de/wochenkarte/",
		new ParserCrowns()));

locations.put("Nachtkantine",
	new Location("in der Nachtkantine",
		"http://www.nachtkantine.de/mittagskarte/",
		new ParserNachtkantine()));

let handlers = {
	"MenusWhenLocation": function() {
		let whenSlot = this.event.request.intent.slots.When;
		let locationSlot = this.event.request.intent.slots.Location;
		let speechOutput: string = "Leider kein Gewinn.";

		let location: Location = locations.get(locationSlot.value);
		http.get(location.getUrl(), (res) => {
			let html: string = "";

			res.on("data", (data: string) => {
				html += data;
			});

			res.on("end", () => {
				location.getParser().setHtml(html);
				location.loadWeeklyMenu();

				let day: Array<Menu> = location.getWeeklyMenu().getDays().get(whenSlot.value);
				if (day && day.length) {
					let menuNames: Array<string> = [];
					day.forEach((menu: Menu) => {
						menuNames.push(menu.getName());
					});

					speechOutput = menuNames.join(". ");
				}
			});
		});

		this.emit(":tell", speechOutput);
	}
};

export function handler(event, context, callback) {
	let alexa = Alexa.handler(event, context);
	alexa.registerHandlers(handlers);
	alexa.execute();
}
