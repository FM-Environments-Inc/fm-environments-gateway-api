import { RemoteGraphQLDataSource, IntrospectAndCompose } from '@apollo/gateway';
import {
  Module,
  HttpStatus,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { verify } from 'jsonwebtoken';
import { INVALID_AUTH_TOKEN, INVALID_BEARER_TOKEN } from './app.constants';

const getToken = (authToken: string): string => {
  console.log(authToken);
  const match = authToken.match(/^Bearer (.*)$/);
  if (!match || match.length < 2) {
    throw new HttpException(
      { message: INVALID_BEARER_TOKEN },
      HttpStatus.UNAUTHORIZED,
    );
  }
  console.log(match[1]);
  return match[1];
};

const decodeToken = (tokenString: string) => {
  const decoded = verify(tokenString, process.env.SECRET_KEY);
  if (!decoded) {
    throw new HttpException(
      { message: INVALID_AUTH_TOKEN },
      HttpStatus.UNAUTHORIZED,
    );
  }
  return decoded;
};
const handleAuth = ({ req }) => {
  try {
    if (req.headers.authorization) {
      const token = getToken(req.headers.authorization);
      const decoded: any = decodeToken(token);
      return {
        userId: decoded.userId,
        permissions: decoded.permissions,
        authorization: `${req.headers.authorization}`,
      };
    }
  } catch (err) {
    throw new UnauthorizedException(
      'User unauthorized with invalid authorization Headers',
    );
  }
};
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      server: {
        context: handleAuth,
      },
      driver: ApolloGatewayDriver,
      gateway: {
        buildService: ({ url }) => {
          return new RemoteGraphQLDataSource({
            url,
            willSendRequest({ request, context }: any) {
              request.http.headers.set('userId', context.userId);
              // for now pass authorization also
              request.http.headers.set('authorization', context.authorization);
              request.http.headers.set('roles', context.roles);
            },
          });
        },
        supergraphSdl: new IntrospectAndCompose({
          subgraphs: [
            { name: 'Auth', url: 'http://localhost:3001/graphql' },
            //{ name: 'Cron', url: 'http://localhost:3002/graphql' },
            //{ name: 'Notifications', url: 'http://localhost:3003/graphql' },
            { name: 'Settings', url: 'http://localhost:3004/graphql' },
            { name: 'Simulation', url: 'http://localhost:3005/graphql' },
            { name: 'TeamPlayer', url: 'http://localhost:3006/graphql' },
            { name: 'TournamentMatche', url: 'http://localhost:3007/graphql' },
            { name: 'User', url: 'http://localhost:3008/graphql' },
          ],
        }),
      },
    }),
  ],
})
export class AppModule {}
