const express = require("express");
const dotenv = require("dotenv");
const bodyparser = require("body-parser");
const { Webhook } = require("svix");
const User = require("./models/User");
const Connection = require("./config/Connection");
const {clerkClient} = require("@clerk/clerk-sdk-node")

dotenv.config();

const app = express();

app.get("/", (req, res) => {
    res.send("Webhook Service");
});

app.post("/api/webhooks", bodyparser.raw({ type: "application/json" }), async (req, res) => {
    try {
        console.log("Webhook received");

        const payloadString = req.body.toString();
        const svixHeaders = req.headers;

        const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET_KEY);
        const evt = wh.verify(payloadString, svixHeaders);

        if (evt.type === "user.created") {
            console.log("User creation event detected");

            const { id, email_addresses, external_accounts,has_image, phone_numbers } = evt.data;

            // Handle missing or undefined properties
            const email = email_addresses?.[0]?.email_address;
            const firstName = external_accounts?.[0]?.given_name;
            const lastName = external_accounts?.[0]?.family_name;
            const HasImage = has_image;
            const picture = external_accounts?.[0]?.picture;
            const phone = phone_numbers?.[0]?.phone_number;

            // Create new User instance
            const NewUser = new User({
                Email: email,
                ClerkId: id,
                FName: firstName,
                LName: lastName,
                HasImage: HasImage,
                Picture: picture,
                Phone: phone
            });


            // Save the user to the database
            const UserSaved = await NewUser.save();

            if (UserSaved) {
                await clerkClient.users.updateUserMetadata(id, {
                  publicMetadata: {
                    userId: UserSaved._id,
                  },
                });
              }

            return res.status(200).json({ 
                message: "Created",
            });
        }

        if(evt.type === "user.deleted"){
            const { id } = evt.data;

            const userToDelete = await User.findOne({ ClerkId:id });

            if (!userToDelete) {
              throw new Error("User not found");
            }
        
            // Delete user
            const DeletedUser = await User.findByIdAndDelete(userToDelete._id);
        
            return res.json({ message: "Deleted"});
        }

        if(evt.type === "user.updated"){
            const { id, first_name, last_name, email_addresses, external_accounts, has_image, phone_numbers } = evt.data;

        // Handle missing or undefined properties
            const email = email_addresses?.[0]?.email_address;
            const firstName = first_name;
            const lastName = last_name;
            const picture = external_accounts?.[0]?.picture;
            const phone = phone_numbers?.[0]?.phone_number;

            // Prepare the update object with only the fields that need to be updated
            const updateData = {};

            if (email) updateData.Email = email;
            if (firstName) updateData.FName = firstName;
            if (lastName) updateData.LName = lastName;
            if (typeof has_image !== 'undefined') updateData.HasImage = has_image;  // Ensure this field is correctly handled
            if (picture) updateData.Picture = picture;
            if (phone) updateData.Phone = phone;

            // Update the user in the database
            const UpdatedUser = await User.findOneAndUpdate(
                { ClerkId: id },
                { $set: updateData },
                { new: true }
            );

            if (!UpdatedUser) throw new Error("User update failed");

            return res.json({ message: "Updated" });
        }
    } catch (error) {
        console.error("Error processing webhook:", error.message);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

const PORT = process.env.PORT || 5000;

Connection().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error('Failed to connect to the database:', error);
});
