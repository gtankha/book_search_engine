const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {

    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password')
            

                return userData;
            }

            throw new AuthenticationError('Not logged in');
        },
        // get all users
        users: async () => {
            return User.find()
                .select('-__v -password')
                .populate('savedBooks')
        }
    },

    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const token = signToken(user);
            return { token, user };
        },
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);

            return { token, user };
        },
        saveBook: async (parent, body, context) => {
            if (context.user) {
                console.log ("arguments");
                 console.log(body);
                 console.log(context.user._id);

                const user = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: body} },
                    { new: true, runValidators: true}
                );

                return user;

            }
            throw new AuthenticationError('You need to be logged in!');

        },

        removeBook: async (parent, args, context) => {
            if (context.user) {
                console.log(context.user);
                console.log(args);
                const user = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: args } },
                    { new: true }
                );

                return user;

            }
            throw new AuthenticationError('You need to be logged in!');


        }


    }


};

module.exports = resolvers;