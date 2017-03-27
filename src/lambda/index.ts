import { MultiStringMap } from "./MultiStringMap";
import { Location } from "./Location";
import { ParserExample } from "./ParserExample";
import { ParserAlteRaffinerie } from "./ParserAlteRaffinerie";
import { ParserCrowns } from "./ParserCrowns";
import { ParserNachtkantine } from "./ParserNachtkantine";
import { Menu } from "./Menu";

import * as winston from "winston";
import * as Alexa from "alexa-sdk";
import * as request from "request";

let logger = new winston.Logger({
	level: process.env.LOG_LEVEL || "info",
	transports: [
		new winston.transports.Console({
			label: "index"
		})
	]
});

let locations: MultiStringMap<Location> = new MultiStringMap<Location>();

locations.put("beispiel",
	new Location("zum Beispiel",
		null,
		new ParserExample()));

locations.multiPut(["alte raffinerie", "storchenburg"],
	new Location("in der Alten Raffinerie",
		"http://www.alte-raffinerie.de/index.php/Essen.html",
		new ParserAlteRaffinerie()));

locations.put("crowns",
	new Location("im Crowns",
		"http://www.crownsrestaurant.de/wochenkarte/",
		new ParserCrowns()));

locations.put("nachtkantine",
	new Location("in der Nachtkantine",
		"http://www.nachtkantine.de/mittagskarte/",
		new ParserNachtkantine()));

let handlers = {
	"MenusWhenLocation": function() {
		let whenSlot = this.event.request.intent.slots.When;
		let locationSlot = this.event.request.intent.slots.Location;

		let speechOutput: string = "";

		let location: Location = locations.get(locationSlot.value.toLowerCase());
		if (location) {
			request(location.getUrl(), (error, response, body) => {
				location.getParser().setHtml(body);
				location.loadWeeklyMenu();

				let day: Array<Menu> = location.getWeeklyMenu().getDays().get(whenSlot.value);
				if (day && day.length) {
					let menuNames: Array<string> = [];
					day.forEach((menu: Menu) => {
						menuNames.push(menu.getName());
					});

					speechOutput = menuNames.join(". ");
				}
				else {
					speechOutput = "Leider kein Gewinn.";
				}

				this.emit(":tell", speechOutput);

				this.context.succeed();
			});
		}
		else {
			this.context.fail();
		}
	}
};

export function handler(event, context, callback) {
	let alexa = Alexa.handler(event, context);
	alexa.registerHandlers(handlers);
	alexa.execute();
}
