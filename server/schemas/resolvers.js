const { AuthenticationError } = require('apollo-server-express');
const { User, Chat, } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    chat: async (parent, { _id }, context) => {
      if (context.user) {
        const chats = await Chat.find({ _id })
        return chats;
      }

      throw new AuthenticationError("Please log in")
    },

    findUser: async (parent, { username }) => {
      const user = await User.findOne({ username })
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    },

    user: async (parent, args, context) => {
      if (context.user) {
        const user = await User.findById(context.user._id).populate('chats')

        return user;
      }

      throw new AuthenticationError('Please log in!')
    }
  },

  Mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('Sorry! No user was found with that email address.');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect password. Please try again.');
      }

      const token = signToken(user);

      return { token, user };
    },
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    createChat: async (parent, args, context) => {
        const newChat = await Chat.create(args)
        return newChat;
    },
    updateChat: async (parent, args, context) => {
      if (context.user) {
        const updatedChat = await Chat.findByIdAndUpdate(
          { _id: args._id },
          { $addToSet: { messages: { messageText: args.messageText, user: args.user } } },
          { new: true }
        )
        return updatedChat
      }
      throw new AuthenticationError('Not logged in');
    }
  },
};

module.exports = resolvers;
